import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_ATTEMPTS, hashVerificationCode } from "@/lib/email-verification";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "کد باید ۶ رقم باشد." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }

  if (!user.emailVerificationCodeHash || !user.emailVerificationCodeExpires) {
    return NextResponse.json({ error: "ابتدا درخواست کد تأیید بدهید." }, { status: 400 });
  }

  const expired = user.emailVerificationCodeExpires < new Date();
  const outOfAttempts = user.emailVerificationAttempts >= MAX_ATTEMPTS;
  if (expired || outOfAttempts) {
    // Clear the spent/expired code so the only way forward is a fresh
    // request — a stale code can't be kept guessed at indefinitely.
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationCodeHash: null, emailVerificationCodeExpires: null, emailVerificationAttempts: 0 },
    });
    return NextResponse.json(
      { error: expired ? "کد منقضی شده است. دوباره درخواست دهید." : "تعداد تلاش‌های مجاز به پایان رسید. دوباره درخواست دهید." },
      { status: 400 },
    );
  }

  if (hashVerificationCode(code) !== user.emailVerificationCodeHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationAttempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "کد وارد شده صحیح نیست." }, { status: 400 });
  }

  const confirmedEmail = user.pendingEmail ?? user.email;

  // Re-check uniqueness right before committing — the window since the code
  // was issued is small, but another account could have claimed the same
  // address in the meantime.
  if (user.pendingEmail) {
    const taken = await prisma.user.findFirst({ where: { email: confirmedEmail, id: { not: user.id } } });
    if (taken) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          emailVerificationCodeHash: null,
          emailVerificationCodeExpires: null,
          emailVerificationAttempts: 0,
        },
      });
      return NextResponse.json(
        { error: "این ایمیل در فاصله‌ی این مدت برای حساب دیگری ثبت شده است." },
        { status: 409 },
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: confirmedEmail,
      emailVerified: new Date(),
      pendingEmail: null,
      emailVerificationCodeHash: null,
      emailVerificationCodeExpires: null,
      emailVerificationAttempts: 0,
    },
  });

  return NextResponse.json({ ok: true, email: confirmedEmail });
}
