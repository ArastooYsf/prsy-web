import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, logEvent } from "@/lib/logger";
import { notifyAccountSecurityChange } from "@/lib/notifications/events";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    return NextResponse.json({ error: "رمز عبور فعلی صحیح نیست." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } });

  await logEvent({
    actor: actorFromSession(session),
    action: "update",
    target: { type: "user", id: user.id, label: "تغییر رمز عبور" },
  });
  await notifyAccountSecurityChange({ user: { id: user.id, email: user.email }, kind: "password_changed" });

  return NextResponse.json({ ok: true });
}
