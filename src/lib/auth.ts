import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { prisma } from "@/lib/prisma";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { verifyTwoFactorCode } from "@/lib/twofactor";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 60;

// Per-IP, independent of which account is being targeted — catches
// brute-force spread across many different emails from one source. Kept
// in-memory (not DB-backed): it's a coarse first line of defense on top of
// the per-account lockout below, which is the one that must survive a
// server restart, so losing this counter on restart is an acceptable
// trade-off for not hitting the DB on every login attempt.
const loginIpRateLimiter = new RateLimiterMemory({
  points: LOGIN_RATE_LIMIT_MAX,
  duration: LOGIN_RATE_LIMIT_WINDOW_SECONDS,
});

// Shared by both a wrong password and a wrong 2FA code — either one counts
// toward the same lockout streak. Returns true if this attempt just locked
// the account.
async function registerFailedAttempt(
  userId: string,
  currentAttempts: number,
  lockedUntil: Date | null,
  now: Date,
): Promise<boolean> {
  const attempts = (lockedUntil && lockedUntil <= now ? 0 : currentAttempts) + 1;
  const lockingNow = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: lockingNow ? 0 : attempts,
      lockedUntil: lockingNow ? new Date(now.getTime() + LOCKOUT_DURATION_MS) : null,
    },
  });
  return lockingNow;
}

function clientIp(headers: Record<string, string | string[] | undefined> | Headers | undefined): string {
  if (!headers) return "unknown";
  const get = (key: string) => (headers instanceof Headers ? headers.get(key) : headers[key]);
  const forwarded = get("x-forwarded-for");
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  const realIp = get("x-real-ip");
  return forwardedIp || (Array.isArray(realIp) ? realIp[0] : realIp) || "unknown";
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // re-issue token at most once a day
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "ایمیل", type: "email" },
        password: { label: "رمز عبور", type: "password" },
        turnstileToken: { label: "Turnstile", type: "text" },
        totpCode: { label: "کد دومرحله‌ای", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const ip = clientIp(req?.headers);

        const turnstileOk = await verifyTurnstileToken(credentials.turnstileToken, ip !== "unknown" ? ip : undefined);
        if (!turnstileOk) {
          throw new Error("TURNSTILE_FAILED");
        }

        try {
          await loginIpRateLimiter.consume(ip);
        } catch {
          throw new Error("TOO_MANY_REQUESTS");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || user.deletedAt) {
          return null;
        }

        const now = new Date();
        if (user.lockedUntil && user.lockedUntil > now) {
          throw new Error("ACCOUNT_LOCKED");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          // A previously-expired lock (lockedUntil in the past) resets the
          // streak instead of stacking onto a stale count.
          const lockingNow = await registerFailedAttempt(user.id, user.failedLoginAttempts, user.lockedUntil, now);
          if (lockingNow) {
            throw new Error("ACCOUNT_LOCKED");
          }
          return null;
        }

        if (user.role === "ADMIN" && user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.totpCode) {
            throw new Error("TOTP_REQUIRED");
          }
          const totpValid = await verifyTwoFactorCode(user.twoFactorSecret, credentials.totpCode);
          if (!totpValid) {
            const lockingNow = await registerFailedAttempt(user.id, user.failedLoginAttempts, user.lockedUntil, now);
            throw new Error(lockingNow ? "ACCOUNT_LOCKED" : "TOTP_INVALID");
          }
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        if (user.role === "CUSTOMER") {
          if (user.approvalStatus === "PENDING") {
            throw new Error("PENDING_APPROVAL");
          }
          if (user.approvalStatus === "REJECTED") {
            throw new Error("REJECTED");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
