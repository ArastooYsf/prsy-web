import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { parseAttachmentsInput } from "@/lib/ticket-attachments";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? sanitizePlainText(body.message).slice(0, 5000) : "";
  const attachments = parseAttachmentsInput(body?.attachments);

  if (!message && attachments.length === 0) {
    return NextResponse.json({ error: "متن پاسخ نمی‌تواند خالی باشد." }, { status: 400 });
  }

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: ticket.id,
      authorId: session.user.id,
      message,
      attachments: { create: attachments },
    },
    include: { attachments: true },
  });

  if (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "ANSWERED" } });
  }

  return NextResponse.json({ reply });
}
