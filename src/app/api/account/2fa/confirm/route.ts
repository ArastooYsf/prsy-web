import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTwoFactorCode } from "@/lib/twofactor";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const secret = typeof body?.secret === "string" ? body.secret : "";
  const code = typeof body?.code === "string" ? body.code : "";

  if (!secret || !code) {
    return NextResponse.json({ error: "کد و secret الزامی است." }, { status: 400 });
  }

  const valid = await verifyTwoFactorCode(secret, code);
  if (!valid) {
    return NextResponse.json({ error: "کد وارد شده نادرست است." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: true },
  });

  return NextResponse.json({ ok: true });
}
