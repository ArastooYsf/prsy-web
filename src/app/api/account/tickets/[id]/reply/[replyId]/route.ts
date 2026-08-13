import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

export async function PATCH(request: Request, { params }: { params: { id: string; replyId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const reply = await prisma.ticketReply.findFirst({
    where: { id: params.replyId, ticketId: params.id, ticket: { userId: session.user.id } },
    include: { attachments: true },
  });

  if (!reply || reply.authorId !== session.user.id || reply.deletedAt) {
    return NextResponse.json({ error: "پیام یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? sanitizePlainText(body.message).slice(0, 5000) : "";

  if (!message && reply.attachments.length === 0) {
    return NextResponse.json({ error: "متن پیام نمی‌تواند خالی باشد." }, { status: 400 });
  }

  const updated = await prisma.ticketReply.update({
    where: { id: reply.id },
    data: { message, editedAt: new Date() },
  });

  return NextResponse.json({ reply: updated });
}

export async function DELETE(request: Request, { params }: { params: { id: string; replyId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const reply = await prisma.ticketReply.findFirst({
    where: { id: params.replyId, ticketId: params.id, ticket: { userId: session.user.id } },
  });

  if (!reply || reply.authorId !== session.user.id || reply.deletedAt) {
    return NextResponse.json({ error: "پیام یافت نشد." }, { status: 404 });
  }

  await prisma.ticketReply.update({
    where: { id: reply.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
