import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? sanitizePlainText(body.name).slice(0, 100) : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "رمز عبور باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "کاربری با این ایمیل قبلاً ثبت‌نام کرده است." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Role is always USER here — admin access is granted separately (via the
  // seed script / DB), never through public self-registration.
  await prisma.user.create({
    data: { email, password: passwordHash, name },
  });

  return NextResponse.json({ ok: true });
}
