import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import {
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  codeIssuedAt,
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCodeEmail,
} from "@/lib/email-verification";

// Issues (or re-issues, as a "resend") a one-time code. With `newEmail` in
// the body this starts an email CHANGE — the code goes to the new address,
// and `email` itself isn't touched until it's confirmed (see confirm/route.ts).
// Without it, this is either the initial post-signup verification or a
// resend of it — the code goes to the account's current address.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const rawNewEmail = typeof body?.newEmail === "string" ? body.newEmail.trim().toLowerCase() : "";

  let pendingEmail = user.pendingEmail;
  if (rawNewEmail) {
    if (!isValidEmail(rawNewEmail)) {
      return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
    }
    if (rawNewEmail === user.email) {
      return NextResponse.json({ error: "این ایمیل همان ایمیل فعلی شماست." }, { status: 400 });
    }
    const taken = await prisma.user.findUnique({ where: { email: rawNewEmail } });
    if (taken) {
      return NextResponse.json({ error: "این ایمیل قبلاً برای حساب دیگری ثبت شده است." }, { status: 409 });
    }
    pendingEmail = rawNewEmail;
  }

  const targetEmail = pendingEmail ?? user.email;

  // Cooldown only guards against hammering "resend" for the SAME target —
  // starting a change to a genuinely different address (or switching which
  // address is pending) always gets a fresh code immediately.
  const sameTarget = pendingEmail === user.pendingEmail;
  if (sameTarget && user.emailVerificationCodeExpires) {
    const issuedAt = codeIssuedAt(user.emailVerificationCodeExpires);
    const elapsed = Date.now() - issuedAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: `لطفاً ${waitSeconds} ثانیه دیگر دوباره تلاش کنید.` },
        { status: 429 },
      );
    }
  }

  const code = generateVerificationCode();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      pendingEmail,
      emailVerificationCodeHash: hashVerificationCode(code),
      emailVerificationCodeExpires: new Date(Date.now() + CODE_TTL_MS),
      emailVerificationAttempts: 0,
    },
  });

  try {
    await sendVerificationCodeEmail(targetEmail, code, pendingEmail !== null);
  } catch {
    return NextResponse.json({ error: "ارسال ایمیل با خطا مواجه شد. لطفاً دوباره تلاش کنید." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, target: targetEmail });
}
