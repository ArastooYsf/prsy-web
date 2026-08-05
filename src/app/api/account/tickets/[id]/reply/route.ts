import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "این تیکت بسته شده است." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? sanitizePlainText(body.message).slice(0, 5000) : "";

  if (!message) {
    return NextResponse.json({ error: "متن پاسخ نمی‌تواند خالی باشد." }, { status: 400 });
  }

  const reply = await prisma.ticketReply.create({
    data: { ticketId: ticket.id, authorId: session.user.id, message },
  });

  const nextStatus = ticket.status === "ANSWERED" ? "IN_PROGRESS" : ticket.status;
  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: nextStatus } });

  return NextResponse.json({ reply });
}
