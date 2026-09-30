import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTwoFactorCode } from "@/lib/twofactor";
import { actorFromSession, logEvent } from "@/lib/logger";
import { notifyAccountSecurityChange } from "@/lib/notifications/events";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "احراز هویت دومرحله‌ای فعال نیست." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";

  const valid = await verifyTwoFactorCode(user.twoFactorSecret, code);
  if (!valid) {
    return NextResponse.json({ error: "کد وارد شده نادرست است." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: null, twoFactorEnabled: false },
  });

  await logEvent({
    category: "security",
    actor: actorFromSession(session),
    action: "update",
    target: { type: "user", id: user.id, label: "احراز هویت دومرحله‌ای" },
    summary: "غیرفعال شد",
  });
  await notifyAccountSecurityChange({ user: { id: user.id, email: user.email }, kind: "two_factor_disabled" });

  return NextResponse.json({ ok: true });
}
