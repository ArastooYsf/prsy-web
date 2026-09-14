import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

const MAX_COMMENT_LENGTH = 2000;

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

  if (!text) {
    return NextResponse.json({ error: "متن دیدگاه الزامی است." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive || product.deletedAt) {
    return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
  }

  const comment = await prisma.productComment.create({
    data: { productId: product.id, userId: session.user.id, text, rating },
  });

  return NextResponse.json({ comment: { id: comment.id, status: comment.status } });
}
