import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";

type ItemInput = { productName: string; quantity: number };

const VALID_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function parseItems(raw: unknown): ItemInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ItemInput =>
        typeof item?.productName === "string" &&
        item.productName.trim().length > 0 &&
        Number.isFinite(item?.quantity) &&
        item.quantity > 0,
    )
    .map((item) => ({ productName: item.productName.trim(), quantity: Math.floor(item.quantity) }));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.order.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const status = VALID_STATUSES.includes(body?.status) ? body.status : existing.status;
  const items = parseItems(body?.items);

  if (!userId || items.length === 0) {
    return NextResponse.json({ error: "مشتری و حداقل یک قلم کالا الزامی است." }, { status: 400 });
  }

  const customer = await prisma.user.findUnique({ where: { id: userId } });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "مشتری معتبر نیست." }, { status: 400 });
  }

  const order = await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId: params.id } });
    return tx.order.update({
      where: { id: params.id },
      data: { userId, status, items: { create: items } },
      include: { items: true },
    });
  });

  await logEvent({
    actor: { id: session.user.id, email: session.user.email ?? "" },
    action: existing.status !== status ? "status_change" : "update",
    target: { type: "order", id: order.id },
    summary:
      existing.status !== status
        ? `وضعیت سفارش «${order.orderNumber}» از ${existing.status} به ${status} تغییر کرد`
        : `سفارش «${order.orderNumber}» ویرایش شد`,
  });

  return NextResponse.json({ order });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const order = await prisma.order.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!order) {
    return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { deletedAt: new Date() } });

  await logEvent({
    actor: { id: session.user.id, email: session.user.email ?? "" },
    action: "delete",
    target: { type: "order", id: order.id },
    summary: `سفارش «${order.orderNumber}» حذف شد`,
  });

  return NextResponse.json({ ok: true });
}
