import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

const MAX_COMMENT_LENGTH = 2000;
// Same ceiling as the ticket chat's own attachment picker per message —
// enough for a real "here's the defect" set of photos without turning one
// comment into an unbounded gallery.
const MAX_IMAGES = 6;

type ImageInput = { url: string; filename: string; mimeType: string; size: number };

function cleanImages(raw: unknown): ImageInput[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: ImageInput[] = [];
  for (const item of raw.slice(0, MAX_IMAGES)) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.url !== "string" || !r.url) continue;
    if (typeof r.mimeType !== "string" || !r.mimeType.startsWith("image/")) continue;
    cleaned.push({
      url: r.url,
      filename: typeof r.filename === "string" ? r.filename : "image",
      mimeType: r.mimeType,
      size: typeof r.size === "number" ? r.size : 0,
    });
  }
  return cleaned;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "برای ثبت دیدگاه ابتدا وارد حساب کاربری شوید." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const text = typeof body?.text === "string" ? sanitizePlainText(body.text).slice(0, MAX_COMMENT_LENGTH) : "";
  const ratingRaw = typeof body?.rating === "number" ? Math.round(body.rating) : null;
  const rating = ratingRaw !== null && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  const images = cleanImages(body?.images);

  if (!text) {
    return NextResponse.json({ error: "متن دیدگاه الزامی است." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive || product.deletedAt) {
    return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
  }

  const comment = await prisma.productComment.create({
    data: {
      productId: product.id,
      userId: session.user.id,
      text,
      rating,
      images: { create: images },
    },
    include: { images: true },
  });

  return NextResponse.json({ comment: { id: comment.id, status: comment.status, images: comment.images } });
}
