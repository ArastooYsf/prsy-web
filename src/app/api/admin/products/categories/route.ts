import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";
import { CATEGORY_ICON_KEYS } from "@/lib/category-icons";
import { PRODUCT_TAXONOMY_TAG } from "@/lib/menu-taxonomy";

function normalizeIcon(input: unknown): string | null {
  return typeof input === "string" && (CATEGORY_ICON_KEYS as readonly string[]).includes(input) ? input : null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام دسته الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 120);
  const icon = normalizeIcon(body.icon);
  const order = Number.isFinite(body.order) ? Math.trunc(body.order) : 0;

  let parentId: string | null = null;
  if (typeof body.parentId === "string" && body.parentId) {
    const parent = await prisma.productCategory.findUnique({ where: { id: body.parentId } });
    if (!parent) return NextResponse.json({ error: "دسته‌ی والد یافت نشد." }, { status: 400 });
    if (parent.parentId) {
      return NextResponse.json({ error: "فقط دو سطح دسته‌بندی مجاز است." }, { status: 400 });
    }
    parentId = parent.id;
  }

  const slug = await ensureUniqueSlug(slugify(name), async (s) => {
    const clash = await prisma.productCategory.findUnique({ where: { slug: s } });
    return clash !== null;
  });

  const category = await prisma.productCategory.create({ data: { name, slug, icon, order, parentId } });
  revalidatePath("/products/all");
  revalidateTag(PRODUCT_TAXONOMY_TAG);
  return NextResponse.json({ category }, { status: 201 });
}
