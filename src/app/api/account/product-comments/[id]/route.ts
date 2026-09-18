import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

const MAX_COMMENT_LENGTH = 2000;
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

// Same ownership shape as the ticket reply edit/delete routes
// (src/app/api/account/tickets/[id]/reply/[replyId]/route.ts): only the
// comment's own author may touch it, and a soft-deleted comment is already
// gone as far as this endpoint is concerned.
async function findOwnComment(id: string, userId: string) {
  const comment = await prisma.productComment.findFirst({ where: { id, userId } });
  if (!comment || comment.deletedAt) return null;
  return comment;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const comment = await findOwnComment(params.id, session.user.id);
  if (!comment) {
    return NextResponse.json({ error: "دیدگاه یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? sanitizePlainText(body.text).slice(0, MAX_COMMENT_LENGTH) : "";
  const ratingRaw = typeof body?.rating === "number" ? Math.round(body.rating) : null;
  const rating = ratingRaw !== null && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  const images = cleanImages(body?.images);

  if (!text) {
    return NextResponse.json({ error: "متن دیدگاه نمی‌تواند خالی باشد." }, { status: 400 });
  }

  // The moderated text just changed, so the comment goes back to PENDING —
  // an edited comment shouldn't stay silently APPROVED with content no one
  // reviewed yet. Existing images are fully replaced with whatever set the
  // client sent (delete-all then recreate is simplest and this table has no
  // other foreign keys pointing at individual image rows).
  const updated = await prisma.productComment.update({
    where: { id: comment.id },
    data: {
      text,
      rating,
      status: "PENDING",
      editedAt: new Date(),
      images: { deleteMany: {}, create: images },
    },
    include: { images: true },
  });

  return NextResponse.json({
    comment: {
      id: updated.id,
      text: updated.text,
      rating: updated.rating,
      status: updated.status,
      editedAt: updated.editedAt,
      images: updated.images,
    },
  });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const comment = await findOwnComment(params.id, session.user.id);
  if (!comment) {
    return NextResponse.json({ error: "دیدگاه یافت نشد." }, { status: 404 });
  }

  await prisma.productComment.update({
    where: { id: comment.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
