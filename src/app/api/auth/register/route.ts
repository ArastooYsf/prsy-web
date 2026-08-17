import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isValidEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const turnstileOk = await verifyTurnstileToken(body?.turnstileToken, request.headers.get("x-forwarded-for") ?? undefined);
  if (!turnstileOk) {
    return NextResponse.json({ error: "تأیید ربات‌نبودن ناموفق بود، دوباره تلاش کنید." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? sanitizePlainText(body.name).slice(0, 100) : null;
  const customerType = body?.customerType === "LEGAL" ? "LEGAL" : "INDIVIDUAL";
  const companyName =
    customerType === "LEGAL" && typeof body?.companyName === "string"
      ? sanitizePlainText(body.companyName).slice(0, 150)
      : null;
  const economicCode =
    customerType === "LEGAL" && typeof body?.economicCode === "string"
      ? sanitizePlainText(body.economicCode).slice(0, 50)
      : null;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "رمز عبور باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
  }
  if (customerType === "LEGAL" && (!companyName?.trim() || !economicCode?.trim())) {
    return NextResponse.json({ error: "نام شرکت و کد اقتصادی برای مشتری حقوقی الزامی است." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "کاربری با این ایمیل قبلاً ثبت‌نام کرده است." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Role is always CUSTOMER here — admin/support access is granted separately
  // (via the seed script / admin panel), never through public self-registration.
  // Legal (corporate) accounts start PENDING and can't log in until staff
  // reviews and approves them; individual accounts are active immediately.
  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      customerType,
      companyName,
      economicCode,
      approvalStatus: customerType === "LEGAL" ? "PENDING" : "APPROVED",
    },
  });

  return NextResponse.json({ ok: true, pendingApproval: user.approvalStatus === "PENDING" });
}
