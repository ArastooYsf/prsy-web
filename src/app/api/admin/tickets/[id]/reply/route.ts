import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? sanitizePlainText(body.message).slice(0, 5000) : "";

  if (!message) {
    return NextResponse.json({ error: "متن پاسخ نمی‌تواند خالی باشد." }, { status: 400 });
  }

  const reply = await prisma.ticketReply.create({
    data: { ticketId: ticket.id, authorId: session.user.id, message },
  });

  if (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "ANSWERED" } });
  }

  return NextResponse.json({ reply });
}
