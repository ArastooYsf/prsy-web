import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/order-number";

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

// Places a self-service order from the customer's own cart — the cart lives
// entirely client-side (localStorage, see CartProvider.tsx), so this is the
// one place its contents actually touch the database. Every price is
// re-fetched here rather than trusted from the request body: the cart is
// built from whatever the product page rendered at add-to-cart time, which
// could be stale (a price changed, or the product went unlisted) by the time
// checkout actually submits.
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

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      orderNumber: generateOrderNumber(),
      items: { create: items },
    },
    select: { id: true },
  });

  return NextResponse.json({ orderId: order.id });
}
