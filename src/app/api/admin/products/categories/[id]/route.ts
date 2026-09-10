import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";
import { CATEGORY_ICON_KEYS } from "@/lib/category-icons";

function normalizeIcon(input: unknown): string | null {
  return typeof input === "string" && (CATEGORY_ICON_KEYS as readonly string[]).includes(input) ? input : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.productCategory.findUnique({
    where: { id: params.id },
    include: { _count: { select: { children: true } } },
  });
  if (!existing) return NextResponse.json({ error: "دسته یافت نشد." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام دسته الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 120);
  const icon = normalizeIcon(body.icon);
  const order = Number.isFinite(body.order) ? Math.trunc(body.order) : existing.order;

  let parentId: string | null = null;
  if (typeof body.parentId === "string" && body.parentId) {
    if (body.parentId === existing.id) {
      return NextResponse.json({ error: "یک دسته نمی‌تواند والد خودش باشد." }, { status: 400 });
    }
    if (existing._count.children > 0) {
      return NextResponse.json({ error: "این دسته زیردسته دارد و نمی‌تواند خودش زیردسته شود." }, { status: 400 });
    }
    const parent = await prisma.productCategory.findUnique({ where: { id: body.parentId } });
    if (!parent) return NextResponse.json({ error: "دسته‌ی والد یافت نشد." }, { status: 400 });
    if (parent.parentId) {
      return NextResponse.json({ error: "فقط دو سطح دسته‌بندی مجاز است." }, { status: 400 });
    }
    parentId = parent.id;
  }

  const slug = await ensureUniqueSlug(slugify(name), async (s) => {
    const clash = await prisma.productCategory.findFirst({ where: { slug: s, NOT: { id: existing.id } } });
    return clash !== null;
  });

  const category = await prisma.productCategory.update({
    where: { id: existing.id },
    data: { name, slug, icon, order, parentId },
  });
  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.productCategory.findUnique({
    where: { id: params.id },
    include: { _count: { select: { children: true, products: true } } },
  });
  if (!existing) return NextResponse.json({ error: "دسته یافت نشد." }, { status: 404 });

  if (existing._count.children > 0) {
    return NextResponse.json({ error: "ابتدا زیردسته‌ها را حذف کنید." }, { status: 400 });
  }
  if (existing._count.products > 0) {
    return NextResponse.json(
      { error: `این دسته به ${existing._count.products} محصول متصل است و قابل حذف نیست.` },
      { status: 400 },
    );
  }

  await prisma.productCategory.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
