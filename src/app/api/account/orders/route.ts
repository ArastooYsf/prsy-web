import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/order-number";
import { snapshotRecipientAddress } from "@/lib/order-recipient";
import { notifyOrderCreated } from "@/lib/notifications/events";
import { sanitizePlainText } from "@/lib/sanitize";
import { isValidIranPhone } from "@/lib/validation";
import { actorFromSession, logEvent } from "@/lib/logger";

const MAX_QUANTITY = 999;

type ItemInput = { productId: string; quantity: number };

function parseItems(raw: unknown): ItemInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ItemInput =>
        typeof item?.productId === "string" &&
        item.productId.length > 0 &&
        Number.isFinite(item?.quantity) &&
        item.quantity >= 1,
    )
    .map((item) => ({ productId: item.productId, quantity: Math.min(Math.floor(item.quantity), MAX_QUANTITY) }));
}

type CustomerTarget = { id: string; email: string; isNew: boolean };
type CustomerResolution = { ok: true; customer: CustomerTarget } | { ok: false; error: string };

// ADMIN/SUPPORT browsing the site and checking out must never have the order
// silently land on their own staff account — this is the one place that
// decides whose order it actually is. A plain CUSTOMER always orders for
// themselves; staff must explicitly name a real customer or hand-enter one.
async function resolveOrderCustomer(
  session: { user: { id: string; email?: string | null; role: string } },
  body: Record<string, unknown> | null,
): Promise<CustomerResolution> {
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    return { ok: true, customer: { id: session.user.id, email: session.user.email ?? "", isNew: false } };
  }

  const customerId = typeof body?.customerId === "string" ? body.customerId : "";
  if (customerId) {
    const customer = await prisma.user.findFirst({
      where: { id: customerId, role: "CUSTOMER", deletedAt: null },
      select: { id: true, email: true },
    });
    if (!customer) {
      return { ok: false, error: "مشتری انتخاب‌شده معتبر نیست." };
    }
    return { ok: true, customer: { id: customer.id, email: customer.email, isNew: false } };
  }

  const manual = body?.manualCustomer as Record<string, unknown> | undefined;
  const name = typeof manual?.name === "string" ? sanitizePlainText(manual.name).slice(0, 100) : "";
  if (!manual || !name) {
    return { ok: false, error: "برای ثبت سفارش باید یک مشتری موجود را انتخاب کنید یا مشخصات مشتری جدید را وارد کنید." };
  }

  const phone = typeof manual.phone === "string" ? sanitizePlainText(manual.phone).slice(0, 30) : "";
  if (phone && !isValidIranPhone(phone)) {
    return { ok: false, error: "شماره تماس مشتری معتبر نیست." };
  }
  const address = typeof manual.address === "string" ? sanitizePlainText(manual.address).slice(0, 300) : null;

  // No email/password the customer would ever use — this account only
  // exists so the order has somewhere real to attach (Order.userId is a
  // required FK), never so they can log in. A random, never-communicated
  // password hash and a synthetic unique email keep it that way; `notes`
  // keeps a permanent trace of who created it this way, for whoever
  // encounters this account later in the admin customer list and wonders.
  const placeholderEmail = `walkin-${randomUUID()}@no-reply.internal`;
  const unusablePassword = await bcrypt.hash(randomUUID(), 12);

  const created = await prisma.user.create({
    data: {
      email: placeholderEmail,
      password: unusablePassword,
      name,
      phone: phone || null,
      address,
      role: "CUSTOMER",
      approvalStatus: "APPROVED",
      emailVerified: new Date(),
      notes: `این حساب هنگام ثبت سفارش توسط ${session.user.email ?? session.user.id} با مشخصات دستی (بدون ایمیل/رمز واقعی) ایجاد شد.`,
    },
    select: { id: true, email: true },
  });

  return { ok: true, customer: { id: created.id, email: created.email, isNew: true } };
}

// Places an order from a cart — the cart lives entirely client-side
// (localStorage, see CartProvider.tsx), so this is the one place its
// contents actually touch the database. Every price is re-fetched here
// rather than trusted from the request body: the cart is built from whatever
// the product page rendered at add-to-cart time, which could be stale (a
// price changed, or the product went unlisted) by the time checkout actually
// submits. Also doubles as the ADMIN/SUPPORT "order on behalf of a customer"
// path — see resolveOrderCustomer above.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const requested = parseItems(body?.items);
  if (requested.length === 0) {
    return NextResponse.json({ error: "سبد خرید خالی است." }, { status: 400 });
  }

  const customerResolution = await resolveOrderCustomer(session, body);
  if (!customerResolution.ok) {
    return NextResponse.json({ error: customerResolution.error }, { status: 400 });
  }
  const { customer } = customerResolution;

  const products = await prisma.product.findMany({
    where: {
      id: { in: requested.map((i) => i.productId) },
      isActive: true,
      deletedAt: null,
      showPrice: true,
      price: { not: null },
    },
    select: { id: true, name: true, price: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  // A product that's gone inactive/unlisted/unpriced since it was added to
  // the cart is silently dropped rather than failing the whole checkout —
  // the customer still gets an order for everything that's still valid.
  const items = requested
    .map((r) => {
      const product = byId.get(r.productId);
      if (!product || product.price == null) return null;
      return { productId: product.id, productName: product.name, price: product.price, quantity: r.quantity };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "هیچ‌کدام از کالاهای سبد خرید دیگر در دسترس نیستند." },
      { status: 400 },
    );
  }

  const recipient = await snapshotRecipientAddress(customer.id);

  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      orderNumber: generateOrderNumber(),
      items: { create: items },
      recipientAddress: recipient.address,
      recipientPostalCode: recipient.postalCode,
      recipientLat: recipient.lat,
      recipientLng: recipient.lng,
    },
    select: { id: true, orderNumber: true },
  });

  await notifyOrderCreated({ order, customer: { id: customer.id, email: customer.email } });

  if (session.user.role === "ADMIN" || session.user.role === "SUPPORT") {
    await logEvent({
      actor: actorFromSession(session),
      action: "create",
      target: { type: "order", id: order.id, label: order.orderNumber },
      summary: customer.isNew
        ? `برای مشتری جدید (مشخصات دستی) — شناسه ${customer.id}`
        : `برای مشتری موجود — شناسه ${customer.id}`,
    });
  }

  return NextResponse.json({ orderId: order.id });
}
