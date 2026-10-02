import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncDefaultPhone } from "@/lib/user-contacts";

// Same ownership shape as the product-comment edit/delete routes
// (src/app/api/account/product-comments/[id]/route.ts): only the phone's
// own owner may touch it.
async function findOwnPhone(id: string, userId: string) {
  return prisma.userPhone.findFirst({ where: { id, userId } });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const phone = await findOwnPhone(params.id, session.user.id);
  if (!phone) {
    return NextResponse.json({ error: "شماره تماس یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (body?.isDefault !== true) {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  // Exactly one phone is ever the default — unset every sibling first, then
  // mark this one, inside a transaction so a concurrent request can never
  // see two defaults (or zero) at once.
  await prisma.$transaction([
    prisma.userPhone.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } }),
    prisma.userPhone.update({ where: { id: phone.id }, data: { isDefault: true } }),
  ]);
  await syncDefaultPhone(session.user.id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const phone = await findOwnPhone(params.id, session.user.id);
  if (!phone) {
    return NextResponse.json({ error: "شماره تماس یافت نشد." }, { status: 404 });
  }

  await prisma.userPhone.delete({ where: { id: phone.id } });

  // Deleting the default one leaves nobody selected — promote whichever is
  // now the most recently added remaining phone, so there's never a gap
  // where the account has saved numbers but none marked default.
  if (phone.isDefault) {
    const next = await prisma.userPhone.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.userPhone.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
  await syncDefaultPhone(session.user.id);

  return NextResponse.json({ ok: true });
}
