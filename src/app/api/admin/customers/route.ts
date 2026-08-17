import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { isValidEmail, isValidIranPhone } from "@/lib/validation";

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
  const customerType = body?.customerType === "LEGAL" ? "LEGAL" : "INDIVIDUAL";
  const companyName =
    customerType === "LEGAL" && typeof body?.companyName === "string"
      ? sanitizePlainText(body.companyName).slice(0, 150)
      : null;
  const economicCode =
    customerType === "LEGAL" && typeof body?.economicCode === "string"
      ? sanitizePlainText(body.economicCode).slice(0, 50)
      : null;
  const notes = typeof body?.notes === "string" ? sanitizePlainText(body.notes).slice(0, 4000) : null;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }
  if (phone && !isValidIranPhone(phone)) {
    return NextResponse.json({ error: "شماره تلفن معتبر نیست." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "رمز عبور باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
  }
  if (customerType === "LEGAL" && (!companyName?.trim() || !economicCode?.trim())) {
    return NextResponse.json({ error: "نام شرکت و کد اقتصادی برای مشتری حقوقی الزامی است." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "کاربری با این ایمیل قبلاً ثبت شده است." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Created directly by staff, so it's already vetted — always APPROVED,
  // regardless of customerType (unlike public self-registration).
  const customer = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      phone,
      role: "CUSTOMER",
      customerType,
      companyName,
      economicCode,
      notes,
      approvalStatus: "APPROVED",
    },
  });

  return NextResponse.json({ customer: { id: customer.id, email: customer.email } });
}
