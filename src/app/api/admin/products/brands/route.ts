import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

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
  const order = Number.isFinite(body.order) ? Math.trunc(body.order) : 0;

  const slug = await ensureUniqueSlug(slugify(name), async (s) => {
    const clash = await prisma.brand.findUnique({ where: { slug: s } });
    return clash !== null;
  });

  const brand = await prisma.brand.create({ data: { name, slug, description, logo, order } });
  return NextResponse.json({ brand }, { status: 201 });
}
