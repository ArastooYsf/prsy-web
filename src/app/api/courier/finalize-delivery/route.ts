import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUploadedFile } from "@/lib/uploads";
import { privateStorage } from "@/lib/storage/private";
import { actorFromSession, logEvent } from "@/lib/logger";
import { notifyOrderStatusChange, notifyStaffOrderDelivered } from "@/lib/notifications/events";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "COURIER") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const orderId = typeof formData?.get("orderId") === "string" ? (formData!.get("orderId") as string) : "";
  const signature = formData?.get("signature");

  if (!orderId || !(signature instanceof File)) {
    return NextResponse.json({ error: "امضا الزامی است." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: { id: true, orderNumber: true, courierId: true, status: true, deliveryCodeVerifiedAt: true, user: { select: { id: true, email: true, phone: true, name: true } } },
  });
  // deliveryCodeVerifiedAt gates this — the courier can't jump straight to
  // signing without the code step (/api/courier/deliver) having happened first.
  if (!order || order.courierId !== session.user.id || order.status !== "SHIPPED" || !order.deliveryCodeVerifiedAt) {
    return NextResponse.json({ error: "سفارش یافت نشد یا کد تحویل هنوز تأیید نشده است." }, { status: 404 });
  }

  const validation = await validateUploadedFile(signature);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { bytes, extension } = validation.result;

  const key = `${randomUUID()}${extension}`;
  await privateStorage.put(key, bytes);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED", recipientSignatureUrl: key },
  });

  await logEvent({
    actor: actorFromSession(session),
    action: "status_change",
    target: { type: "order", id: updated.id, label: `سفارش «${updated.orderNumber}»` },
    summary: "از «ارسال‌شده» به «تحویل داده‌شده» (امضای گیرنده)",
  });

  void notifyOrderStatusChange({
    order: { id: updated.id, orderNumber: updated.orderNumber },
    customer: { id: order.user.id, email: order.user.email, phone: order.user.phone, name: order.user.name },
    newStatus: "DELIVERED",
  });
  void notifyStaffOrderDelivered({
    order: { id: updated.id, orderNumber: updated.orderNumber },
    customerName: order.user.name ?? order.user.email,
  });

  return NextResponse.json({ ok: true });
}
