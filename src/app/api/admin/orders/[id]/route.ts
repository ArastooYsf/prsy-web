import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, logEvent } from "@/lib/logger";
import { ORDER_STATUS } from "@/lib/status-labels";
import { notifyOrderStatusChange } from "@/lib/notifications/events";

type ItemInput = { productId: string | null; productName: string; quantity: number; price: number };

const VALID_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function parseItems(raw: unknown): ItemInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ItemInput =>
        typeof item?.productName === "string" &&
        item.productName.trim().length > 0 &&
        Number.isFinite(item?.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item?.price) &&
        item.price >= 0 &&
        (item.productId === null || item.productId === undefined || typeof item.productId === "string"),
    )
    .map((item) => ({
      productId: typeof item.productId === "string" ? item.productId : null,
      productName: item.productName.trim(),
      quantity: Math.floor(item.quantity),
      price: Math.floor(item.price),
    }));
}

// Same re-verification as the create route (POST /api/admin/orders) — a
// productId submitted from the browser might reference a product deleted
// since the last search, so it's dropped back to a manual line rather than
// failing the whole save.
async function resolveProductLinks(items: ItemInput[]): Promise<ItemInput[]> {
  const ids = [...new Set(items.map((i) => i.productId).filter((id): id is string => id !== null))];
  if (ids.length === 0) return items;

  const found = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const validIds = new Set(found.map((p) => p.id));

  return items.map((item) => (item.productId && !validIds.has(item.productId) ? { ...item, productId: null } : item));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.order.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const status = VALID_STATUSES.includes(body?.status) ? body.status : existing.status;
  const items = await resolveProductLinks(parseItems(body?.items));

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
    actor: actorFromSession(session),
    action: existing.status !== status ? "status_change" : "update",
    target: { type: "order", id: order.id, label: `سفارش «${order.orderNumber}»` },
    summary:
      existing.status !== status
        ? `از «${ORDER_STATUS[existing.status]?.label ?? existing.status}» به «${ORDER_STATUS[status]?.label ?? status}»`
        : undefined,
  });

  if (existing.status !== status) {
    void notifyOrderStatusChange({
      order: { id: order.id, orderNumber: order.orderNumber },
      customer: { id: customer.id, email: customer.email, phone: customer.phone, name: customer.name },
      newStatus: status,
    });
  }

  return NextResponse.json({ order });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const order = await prisma.order.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!order) {
    return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { deletedAt: new Date() } });

  await logEvent({
    actor: actorFromSession(session),
    action: "delete",
    target: { type: "order", id: order.id, label: `سفارش «${order.orderNumber}»` },
  });

  return NextResponse.json({ ok: true });
}
