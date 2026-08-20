import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { parseAttachmentsInput } from "@/lib/ticket-attachments";
import { notifyStaffNewCustomerMessage } from "@/lib/notifications/events";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
  });

  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "این تیکت بسته شده است." }, { status: 400 });
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

  // A new customer message always reactivates the ticket into "waiting for
  // support reply" — regardless of whatever status it was in before (unless
  // CLOSED, which is blocked above and never reaches this point).
  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "WAITING_REPLY" } });

  void notifyStaffNewCustomerMessage({
    ticket: { id: ticket.id, subject: ticket.subject },
    customer: { id: session.user.id, email: session.user.email ?? "", name: session.user.name },
  });

  return NextResponse.json({ reply });
}
