import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { isValidEmail, isValidIranPhone } from "@/lib/validation";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? sanitizePlainText(body.name).slice(0, 100) : "";
  const phone = typeof body?.phone === "string" ? sanitizePlainText(body.phone).slice(0, 30) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const alternatePhone =
    typeof body?.alternatePhone === "string" ? sanitizePlainText(body.alternatePhone).slice(0, 30) : "";
  const address = typeof body?.address === "string" ? sanitizePlainText(body.address).slice(0, 300) : "";
  const avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 300) : "";
  const companyName =
    typeof body?.companyName === "string" ? sanitizePlainText(body.companyName).slice(0, 150) : "";
  const economicCode =
    typeof body?.economicCode === "string" ? sanitizePlainText(body.economicCode).slice(0, 50) : "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }
  if (phone && !isValidIranPhone(phone)) {
    return NextResponse.json({ error: "شماره تماس معتبر نیست." }, { status: 400 });
  }
  if (alternatePhone && !isValidIranPhone(alternatePhone)) {
    return NextResponse.json({ error: "شماره تماس جایگزین معتبر نیست." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "این ایمیل قبلاً توسط کاربر دیگری استفاده شده است." }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || null,
      phone: phone || null,
      email,
      alternatePhone: alternatePhone || null,
      address: address || null,
      avatarUrl: avatarUrl || null,
      companyName: companyName || null,
      economicCode: economicCode || null,
    },
  });

  return NextResponse.json({
    user: {
      name: user.name,
      phone: user.phone,
      email: user.email,
      alternatePhone: user.alternatePhone,
      address: user.address,
      avatarUrl: user.avatarUrl,
      companyName: user.companyName,
      economicCode: user.economicCode,
    },
  });
}
