import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// PrismaMariaDb's second (options) constructor arg can't carry PoolConfig
// fields like allowPublicKeyRetrieval when the first arg is a plain string —
// so it's applied here, on the string itself, instead. Guarantees this is
// always on regardless of whether DATABASE_URL happens to include it, and
// mysql's caching_sha2_password auth (default on 8+/9+) needs it to work
// over a plain, non-TLS connection — without it, auth fails with an RSA
// key-exchange error before any query even runs.
function withAllowPublicKeyRetrieval(connectionString: string): string {
  if (!connectionString) return connectionString;
  try {
    const url = new URL(connectionString);
    if (!url.searchParams.has("allowPublicKeyRetrieval")) {
      url.searchParams.set("allowPublicKeyRetrieval", "true");
    }
    return url.toString();
  } catch {
    // A non-empty DATABASE_URL that new URL() can't parse — most likely an
    // unescaped special character (#, ?, @) in the password. Logged (never
    // thrown: next build imports this module for every route regardless of
    // static/dynamic status — see src/app/sitemap.ts's comment for why that
    // matters) so this doesn't fail silently and quietly skip the one thing
    // this function exists to guarantee.
    console.error(
      "[prisma] DATABASE_URL is set but could not be parsed as a URL — allowPublicKeyRetrieval was not applied. If the password contains #, ?, @, or another URL-special character, it needs to be percent-encoded.",
    );
    return connectionString;
  }
}

const adapter = new PrismaMariaDb(withAllowPublicKeyRetrieval(process.env.DATABASE_URL ?? ""));

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
