import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";
import { parseProductImages, parseProductSpecs } from "@/lib/product-json";
import {
  resolveCategoryId,
  resolveBrandId,
  normalizeAvailability,
  normalizePrice,
} from "@/lib/product-normalize";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام محصول الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 200);
  const description =
    typeof body.description === "string" && body.description.trim() ? sanitizeRichText(body.description) : null;
  const images = parseProductImages(body.images);
  const specs = parseProductSpecs(body.specs);
  const showPrice = Boolean(body.showPrice);
  const price = normalizePrice(body.price, showPrice);
  const availability = normalizeAvailability(body.availability);
  const isActive = body.isActive === undefined ? existing.isActive : Boolean(body.isActive);
  const categoryId = await resolveCategoryId(body.categoryId);
  const brandId = await resolveBrandId(body.brandId);

  const requestedSlug =
    typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(name);
  const slug = await ensureUniqueSlug(requestedSlug, async (s) => {
    const clash = await prisma.product.findFirst({ where: { slug: s, NOT: { id: existing.id } } });
    return clash !== null;
  });

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: { name, slug, description, images, specs, categoryId, brandId, availability, showPrice, price, isActive },
  });

  revalidatePath("/products/all");
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
  }

  await prisma.product.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });

  revalidatePath("/products/all");
  return NextResponse.json({ ok: true });
}
