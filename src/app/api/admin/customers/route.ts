import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { isValidEmail, isValidIranPhone } from "@/lib/validation";
import { verifyNationalId, summarizeOutcome } from "@/lib/national-id-verification";
import { actorFromSession, logEvent } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? sanitizePlainText(body.name).slice(0, 100) : null;
  const phone = typeof body?.phone === "string" ? sanitizePlainText(body.phone).slice(0, 30) : null;
  const alternatePhone =
    typeof body?.alternatePhone === "string" ? sanitizePlainText(body.alternatePhone).slice(0, 30) : null;
  const address = typeof body?.address === "string" ? sanitizePlainText(body.address).slice(0, 300) : null;
  const customerType = body?.customerType === "LEGAL" ? "LEGAL" : "INDIVIDUAL";
  const companyName =
    customerType === "LEGAL" && typeof body?.companyName === "string"
      ? sanitizePlainText(body.companyName).slice(0, 150)
      : null;
  const nationalId =
    customerType === "LEGAL" && typeof body?.nationalId === "string"
      ? sanitizePlainText(body.nationalId).slice(0, 50)
      : null;
  const notes = typeof body?.notes === "string" ? sanitizePlainText(body.notes).slice(0, 4000) : null;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }
  if (phone && !isValidIranPhone(phone)) {
    return NextResponse.json({ error: "شماره تلفن معتبر نیست." }, { status: 400 });
  }
  if (alternatePhone && !isValidIranPhone(alternatePhone)) {
    return NextResponse.json({ error: "شماره تماس جایگزین معتبر نیست." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "رمز عبور باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
  }
  if (customerType === "LEGAL" && (!companyName?.trim() || !nationalId?.trim())) {
    return NextResponse.json({ error: "نام شرکت و شناسه ملی برای مشتری حقوقی الزامی است." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "کاربری با این ایمیل قبلاً ثبت شده است." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Same server-side-only verification rule as public self-registration
  // (see src/app/api/auth/register/route.ts) — the admin's own "استعلام"
  // preview click is never trusted, this call is the authoritative one.
  const { outcome, fields } = await verifyNationalId(nationalId);

  // Created directly by staff, so it's already vetted — always APPROVED,
  // regardless of customerType (unlike public self-registration).
  const customer = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      phone,
      alternatePhone,
      address,
      role: "CUSTOMER",
      customerType,
      companyName,
      ...fields,
      notes,
      approvalStatus: "APPROVED",
    },
  });

  if (outcome) {
    await logEvent({
      actor: actorFromSession(session),
      action: outcome.verified ? "national_id_inquiry_success" : "national_id_inquiry_failed",
      target: { type: "customer", id: customer.id, label: `مشتری جدید «${companyName ?? customer.email}»` },
      summary: summarizeOutcome(outcome),
    });
  }

  return NextResponse.json({ customer: { id: customer.id, email: customer.email } });
}
