import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const postId = typeof body?.postId === "string" ? body.postId : null;
  if (!postId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await prisma.blogPost.update({
      where: { id: postId, published: true },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
