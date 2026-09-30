import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { parseAttachmentsInput } from "@/lib/ticket-attachments";
import { findRecentDuplicateReply } from "@/lib/ticket-reply-dedup";
import { notifyTicketReply } from "@/lib/notifications/events";
import { actorFromSession, logEvent } from "@/lib/logger";
import { mapTicketReplyToChatMessage } from "@/lib/ticket-chat-messages";

// See the customer-side GET handler (src/app/api/account/tickets/[id]/reply)
// for why this returns the full reply list rather than an incremental diff.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, deletedAt: null },
    select: { id: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: ticket.id },
    include: { author: true, attachments: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    messages: replies.map((reply) => mapTicketReplyToChatMessage(reply, session.user.id, "staff")),
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { user: { select: { id: true, email: true, phone: true, name: true } } },
  });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? sanitizePlainText(body.message).slice(0, 5000) : "";
  const attachments = parseAttachmentsInput(body?.attachments);

  if (!message && attachments.length === 0) {
    return NextResponse.json({ error: "متن پاسخ نمی‌تواند خالی باشد." }, { status: 400 });
  }

  const duplicate = await findRecentDuplicateReply(ticket.id, session.user.id, message);
  if (duplicate) {
    return NextResponse.json({ reply: duplicate });
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

  if (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS" || ticket.status === "WAITING_REPLY") {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "ANSWERED" } });
  }

  void notifyTicketReply({
    ticket: { id: ticket.id, subject: ticket.subject },
    customer: ticket.user,
    replyMessage: message || "یک پیوست جدید برای تیکت شما ارسال شد.",
  });

  await logEvent({
    actor: actorFromSession(session),
    action: "create",
    target: { type: "ticket_reply", id: reply.id, label: `پاسخ به تیکت «${ticket.subject}»` },
  });

  return NextResponse.json({ reply });
}
