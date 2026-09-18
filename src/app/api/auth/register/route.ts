import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isValidEmail, isValidUsername } from "@/lib/validation";
import { verifyNationalId, summarizeOutcome } from "@/lib/national-id-verification";
import { logEvent } from "@/lib/logger";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const turnstileOk = await verifyTurnstileToken(body?.turnstileToken, request.headers.get("x-forwarded-for") ?? undefined);
  if (!turnstileOk) {
    return NextResponse.json({ error: "تأیید ربات‌نبودن ناموفق بود، دوباره تلاش کنید." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? sanitizePlainText(body.name).slice(0, 100) : null;
  const rawUsername = typeof body?.username === "string" ? body.username.trim() : "";
  const username = rawUsername ? sanitizePlainText(rawUsername).slice(0, 30) : null;
  const customerType = body?.customerType === "LEGAL" ? "LEGAL" : "INDIVIDUAL";
  const companyName =
    customerType === "LEGAL" && typeof body?.companyName === "string"
      ? sanitizePlainText(body.companyName).slice(0, 150)
      : null;
  const nationalId =
    customerType === "LEGAL" && typeof body?.nationalId === "string"
      ? sanitizePlainText(body.nationalId).slice(0, 50)
      : null;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "رمز عبور باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
  }
  if (username !== null && !isValidUsername(username)) {
    return NextResponse.json({ error: "نام کاربری باید ۳ تا ۳۰ کاراکتر و شامل حروف انگلیسی، عدد یا _ باشد." }, { status: 400 });
  }
  if (customerType === "LEGAL" && (!companyName?.trim() || !nationalId?.trim())) {
    return NextResponse.json({ error: "نام شرکت و شناسه ملی برای مشتری حقوقی الزامی است." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "کاربری با این ایمیل قبلاً ثبت‌نام کرده است." }, { status: 409 });
  }

  if (username !== null) {
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "این نام کاربری قبلاً استفاده شده است." }, { status: 409 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Authoritative, server-side re-check — never trust whatever the client's
  // own "استعلام" preview call (NationalIdInquiryField, POST
  // /api/legal-entity/inquire) reported, since that's just a UI convenience
  // a client could fake. A failed/unreachable/dissolved-company inquiry
  // never blocks registration — it only leaves nationalIdVerified=false (or
  // nationalIdActive=false for a found-but-dissolved company) so admins can
  // spot it later (see src/app/account/admin/customers/pending/page.tsx,
  // now an advisory list rather than a login-blocking approval queue).
  const { outcome, fields } = await verifyNationalId(nationalId);

  // Role is always CUSTOMER here — admin/support access is granted separately
  // (via the seed script / admin panel), never through public self-registration.
  // Both individual and legal accounts are active immediately now — legal
  // identity is verified automatically (see above), not by a manual staff
  // gate that used to block login until someone reviewed it.
  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      username,
      customerType,
      companyName,
      ...fields,
      approvalStatus: "APPROVED",
    },
  });

  if (outcome) {
    await logEvent({
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: outcome.verified ? "national_id_inquiry_success" : "national_id_inquiry_failed",
      target: { type: "user", id: user.id, label: `ثبت‌نام «${companyName ?? user.email}»` },
      summary: summarizeOutcome(outcome),
    });
  }

  return NextResponse.json({ ok: true });
}
