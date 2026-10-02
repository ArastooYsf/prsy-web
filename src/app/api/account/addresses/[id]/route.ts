import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncDefaultAddress } from "@/lib/user-contacts";

// Same ownership shape as src/app/api/account/phones/[id]/route.ts.
async function findOwnAddress(id: string, userId: string) {
  return prisma.userAddress.findFirst({ where: { id, userId } });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const address = await findOwnAddress(params.id, session.user.id);
  if (!address) {
    return NextResponse.json({ error: "آدرس یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (body?.isDefault !== true) {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.userAddress.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } }),
    prisma.userAddress.update({ where: { id: address.id }, data: { isDefault: true } }),
  ]);
  await syncDefaultAddress(session.user.id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const address = await findOwnAddress(params.id, session.user.id);
  if (!address) {
    return NextResponse.json({ error: "آدرس یافت نشد." }, { status: 404 });
  }

  await prisma.userAddress.delete({ where: { id: address.id } });

  if (address.isDefault) {
    const next = await prisma.userAddress.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.userAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
  await syncDefaultAddress(session.user.id);

  return NextResponse.json({ ok: true });
}
