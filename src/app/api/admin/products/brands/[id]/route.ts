import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.brand.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "برند یافت نشد." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام برند الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 120);
  const description =
    typeof body.description === "string" && body.description.trim()
      ? sanitizePlainText(body.description).slice(0, 1000)
      : null;
  const logo = typeof body.logo === "string" && body.logo.trim() ? body.logo.trim() : null;
  const order = Number.isFinite(body.order) ? Math.trunc(body.order) : existing.order;

  const slug = await ensureUniqueSlug(slugify(name), async (s) => {
    const clash = await prisma.brand.findFirst({ where: { slug: s, NOT: { id: existing.id } } });
    return clash !== null;
  });

  const brand = await prisma.brand.update({
    where: { id: existing.id },
    data: { name, slug, description, logo, order },
  });
  revalidatePath("/products/all");
  return NextResponse.json({ brand });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.brand.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "برند یافت نشد." }, { status: 404 });

  const productCount = await prisma.product.count({ where: { brandId: existing.id, deletedAt: null } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `این برند به ${productCount} محصول متصل است و قابل حذف نیست.` },
      { status: 400 },
    );
  }

  await prisma.brand.delete({ where: { id: existing.id } });
  revalidatePath("/products/all");
  return NextResponse.json({ ok: true });
}
