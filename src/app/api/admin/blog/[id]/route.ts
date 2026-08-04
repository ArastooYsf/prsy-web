import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

async function ensureUniqueSlug(base: string, excludeId: string): Promise<string> {
  const candidate = base || "post";
  const clash = await prisma.blogPost.findFirst({ where: { slug: candidate, NOT: { id: excludeId } } });
  if (!clash) return candidate;

  let suffix = 2;
  while (
    await prisma.blogPost.findFirst({ where: { slug: `${candidate}-${suffix}`, NOT: { id: excludeId } } })
  ) {
    suffix += 1;
  }
  return `${candidate}-${suffix}`;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "پست یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "عنوان الزامی است." }, { status: 400 });
  }
  if (typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "متن پست الزامی است." }, { status: 400 });
  }

  const title = sanitizePlainText(body.title).slice(0, 200);
  const excerpt = typeof body.excerpt === "string" ? sanitizePlainText(body.excerpt).slice(0, 500) : null;
  const content = sanitizeRichText(body.content);
  const coverImage = typeof body.coverImage === "string" && body.coverImage.trim() ? body.coverImage.trim() : null;
  const published = Boolean(body.published);
  const publishedAt = published
    ? body.publishedAt
      ? new Date(body.publishedAt)
      : existing.publishedAt ?? new Date()
    : null;

  const requestedSlug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(title);
  const slug = await ensureUniqueSlug(requestedSlug, existing.id);

  const post = await prisma.blogPost.update({
    where: { id: existing.id },
    data: { title, slug, excerpt, content, coverImage, published, publishedAt },
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  revalidatePath(`/blog/${slug}`);

  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "پست یافت نشد." }, { status: 404 });
  }

  await prisma.blogPost.delete({ where: { id: existing.id } });

  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);

  return NextResponse.json({ ok: true });
}
