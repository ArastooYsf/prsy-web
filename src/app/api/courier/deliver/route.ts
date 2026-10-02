import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, logEvent } from "@/lib/logger";
import { notifyOrderStatusChange } from "@/lib/notifications/events";

// The delivery code is only 4 digits (10,000 combinations) — without this,
// the courier assigned to an order could script every combination in
// seconds and mark it DELIVERED without the customer ever confirming
// receipt, defeating the entire point of the code. Keyed per courier+order
// so one order's wrong guesses don't lock the courier out of others.
const DELIVER_RATE_LIMIT_MAX = 5;
const DELIVER_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

const deliverRateLimiter = new RateLimiterMemory({
  points: DELIVER_RATE_LIMIT_MAX,
  duration: DELIVER_RATE_LIMIT_WINDOW_SECONDS,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "COURIER") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!orderId || !code) {
    return NextResponse.json({ error: "کد تحویل الزامی است." }, { status: 400 });
  }

  try {
    await deliverRateLimiter.consume(`${session.user.id}:${orderId}`);
  } catch {
    return NextResponse.json({ error: "تعداد تلاش‌های ناموفق بیش از حد مجاز است، کمی بعد دوباره تلاش کنید." }, { status: 429 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      courierId: true,
      status: true,
      deliveryCode: true,
      user: { select: { id: true, email: true, phone: true, name: true } },
    },
  });
  if (!order || order.courierId !== session.user.id || order.status !== "SHIPPED") {
    return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
  }

  if (!order.deliveryCode || code !== order.deliveryCode) {
    return NextResponse.json({ error: "کد تحویل نادرست است." }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveryCodeVerifiedAt: new Date() },
  });

  await logEvent({
    actor: actorFromSession(session),
    action: "status_change",
    target: { type: "order", id: updated.id, label: `سفارش «${updated.orderNumber}»` },
    summary: "از «ارسال‌شده» به «تحویل داده‌شده» (تأیید پیک)",
  });

  void notifyOrderStatusChange({
    order: { id: updated.id, orderNumber: updated.orderNumber },
    customer: { id: order.user.id, email: order.user.email, phone: order.user.phone, name: order.user.name },
    newStatus: "DELIVERED",
  });

  return NextResponse.json({ ok: true });
}
