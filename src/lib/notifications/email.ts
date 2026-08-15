import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sandbox fallback so local dev never crashes on a missing env var — real
// delivery still requires a verified domain in Resend (see the setup report).
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "پویش راه صنعت یاشار <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  if (!resend) {
    throw new Error("RESEND_API_KEY تنظیم نشده است.");
  }

  const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  if (error) {
    throw new Error(error.message);
  }
}
