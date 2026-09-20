import { randomInt, createHash } from "crypto";
import { sendEmail } from "@/lib/notifications/email";

export const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_ATTEMPTS = 5;
// A fresh code can't be requested again until the previous one is at least
// this old — keeps a "resend" button from being hammered into spamming the
// same inbox (and burning Resend's quota) on every click.
export const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashVerificationCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// The moment a still-valid code was issued, derived from its own expiry —
// avoids a separate "sentAt" column just for the resend cooldown.
export function codeIssuedAt(expiresAt: Date): Date {
  return new Date(expiresAt.getTime() - CODE_TTL_MS);
}

export async function sendVerificationCodeEmail(to: string, code: string, isChange: boolean): Promise<void> {
  const heading = isChange ? "تأیید ایمیل جدید" : "تأیید ایمیل حساب کاربری";
  const intro = isChange
    ? "برای تکمیل تغییر ایمیل حساب کاربری‌تان در پویش راه صنعت یاشار، کد زیر را در صفحه‌ی تأیید وارد کنید:"
    : "برای تأیید ایمیل حساب کاربری‌تان در پویش راه صنعت یاشار، کد زیر را در صفحه‌ی تأیید وارد کنید:";

  const html = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h2 style="margin: 0 0 16px; font-size: 18px;">${heading}</h2>
      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.8; color: #475569;">${intro}</p>
      <div style="text-align: center; margin: 0 0 20px;">
        <span style="display: inline-block; padding: 12px 28px; border-radius: 12px; background: #f1f5f9; font-size: 28px; font-weight: bold; letter-spacing: 8px; direction: ltr;">${code}</span>
      </div>
      <p style="margin: 0; font-size: 12px; line-height: 1.8; color: #94a3b8;">این کد تا ۱۰ دقیقه دیگر معتبر است. اگر این درخواست از طرف شما نبوده، این پیام را نادیده بگیرید.</p>
    </div>
  `.trim();

  await sendEmail({ to, subject: `${code} — کد تأیید ایمیل`, html });
}
