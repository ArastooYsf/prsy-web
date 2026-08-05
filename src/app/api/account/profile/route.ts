import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? sanitizePlainText(body.name).slice(0, 100) : "";
  const phone = typeof body?.phone === "string" ? sanitizePlainText(body.phone).slice(0, 30) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "این ایمیل قبلاً توسط کاربر دیگری استفاده شده است." }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name || null, phone: phone || null, email },
  });

  return NextResponse.json({ user: { name: user.name, phone: user.phone, email: user.email } });
}
