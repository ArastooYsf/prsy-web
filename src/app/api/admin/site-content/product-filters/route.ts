import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_CONTENT_TAG, PRODUCT_FILTERS_KEY, DEFAULT_PRODUCT_FILTERS_CONTENT, type ProductFiltersContent } from "@/lib/site-content";

function normalizeToggle(input: unknown, fallback: { enabled: boolean; order: number }) {
  if (!input || typeof input !== "object") return fallback;
  const enabled = Boolean((input as Record<string, unknown>).enabled);
  const rawOrder = (input as Record<string, unknown>).order;
  const order = Number.isFinite(rawOrder) ? Math.trunc(rawOrder as number) : fallback.order;
  return { enabled, order };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  const content: ProductFiltersContent = {
    brand: normalizeToggle(body.brand, DEFAULT_PRODUCT_FILTERS_CONTENT.brand),
    stock: normalizeToggle(body.stock, DEFAULT_PRODUCT_FILTERS_CONTENT.stock),
    price: normalizeToggle(body.price, DEFAULT_PRODUCT_FILTERS_CONTENT.price),
  };

  await prisma.siteContent.upsert({
    where: { key: PRODUCT_FILTERS_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: PRODUCT_FILTERS_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);

  return NextResponse.json({ ok: true, content });
}
