import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CODE_TTL_MS,
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCodeEmail,
} from "@/lib/email-verification";
import VerifyEmailForm from "@/components/account/VerifyEmailForm";

export const metadata: Metadata = {
  title: "تأیید ایمیل",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage() {
  const session = await getServerSession(authOptions);
  let user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  // Nothing to verify — either already verified with no email change in
  // flight, or a request for a code hasn't been made yet at all.
  if (user.emailVerified && !user.pendingEmail) {
    redirect("/account");
  }

  const targetEmail = user.pendingEmail ?? user.email;
  const isChange = user.pendingEmail !== null;

  // No active code yet — e.g. the registration-time send failed (best-effort,
  // see /api/auth/register), or the original code expired before the user
  // ever got here. Send a fresh one now rather than showing "a code was
  // sent" copy that wouldn't actually be true.
  const hasActiveCode =
    user.emailVerificationCodeHash && user.emailVerificationCodeExpires && user.emailVerificationCodeExpires > new Date();
  if (!hasActiveCode) {
    const code = generateVerificationCode();
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCodeHash: hashVerificationCode(code),
        emailVerificationCodeExpires: new Date(Date.now() + CODE_TTL_MS),
        emailVerificationAttempts: 0,
      },
    });
    await sendVerificationCodeEmail(targetEmail, code, isChange).catch(() => {
      // Surfaced to the user via the "resend" button if this silently
      // failed — the page still renders normally either way.
    });
  }

  return (
    <div className="py-8">
      <VerifyEmailForm targetEmail={targetEmail} isChange={isChange} />
    </div>
  );
}
