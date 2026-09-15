import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ItemInput = { productId: string | null; productName: string; quantity: number; price: number };

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

// A row's productId comes straight from the admin's browser — re-verify it
// still refers to a real product before trusting it, and silently fall back
// to a manual line (rather than rejecting the whole order) for any id that's
// stale or was deleted between search and submit.
async function resolveProductLinks(items: ItemInput[]): Promise<ItemInput[]> {
  const ids = [...new Set(items.map((i) => i.productId).filter((id): id is string => id !== null))];
  if (ids.length === 0) return items;

  const found = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const validIds = new Set(found.map((p) => p.id));

  return items.map((item) => (item.productId && !validIds.has(item.productId) ? { ...item, productId: null } : item));
}

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const items = await resolveProductLinks(parseItems(body?.items));

  if (!userId || items.length === 0) {
    return NextResponse.json({ error: "مشتری و حداقل یک قلم کالا الزامی است." }, { status: 400 });
  }

  const customer = await prisma.user.findUnique({ where: { id: userId } });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "مشتری معتبر نیست." }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      userId,
      orderNumber: generateOrderNumber(),
      items: { create: items },
    },
    include: { items: true },
  });

  return NextResponse.json({ order });
}
