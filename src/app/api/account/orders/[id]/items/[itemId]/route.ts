import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Lets a customer remove a single line from their OWN order while it's
// still PENDING (before staff has started processing it) — same
// ownership-check shape as every other self-service delete in this app
// (findFirst scoped by the owning relation's userId, never a bare id
// lookup).
export async function DELETE(request: Request, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const item = await prisma.orderItem.findFirst({
    where: { id: params.itemId, orderId: params.id, order: { userId: session.user.id, deletedAt: null } },
    include: { order: { select: { status: true, _count: { select: { items: true } } } } },
  });

  if (!item) {
    return NextResponse.json({ error: "قلم سفارش یافت نشد." }, { status: 404 });
  }
  if (item.order.status !== "PENDING") {
    return NextResponse.json({ error: "این سفارش دیگر قابل ویرایش نیست." }, { status: 400 });
  }
  if (item.order._count.items <= 1) {
    return NextResponse.json(
      { error: "حذف آخرین قلم مجاز نیست — برای لغو کامل سفارش از گزینه‌ی «لغو سفارش» استفاده کنید." },
      { status: 400 },
    );
  }

  await prisma.orderItem.delete({ where: { id: item.id } });

  return NextResponse.json({ ok: true });
}
