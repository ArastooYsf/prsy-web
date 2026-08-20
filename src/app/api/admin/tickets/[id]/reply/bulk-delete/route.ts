import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const replyIds = Array.isArray(body?.replyIds) ? body.replyIds.filter((id: unknown) => typeof id === "string") : [];

  if (replyIds.length === 0) {
    return NextResponse.json({ error: "هیچ پیامی انتخاب نشده است." }, { status: 400 });
  }

  const replies = await prisma.ticketReply.findMany({
    where: { id: { in: replyIds }, ticketId: params.id },
  });

  const deletableIds = replies.filter((r) => r.authorId === session.user.id && !r.deletedAt).map((r) => r.id);
  const skippedIds = replyIds.filter((id: string) => !deletableIds.includes(id));

  if (deletableIds.length > 0) {
    await prisma.ticketReply.updateMany({
      where: { id: { in: deletableIds } },
      data: { deletedAt: new Date() },
    });
  }

  return NextResponse.json({ deletedIds: deletableIds, skippedIds });
}
