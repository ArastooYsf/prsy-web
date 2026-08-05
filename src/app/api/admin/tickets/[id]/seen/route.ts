import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  await Promise.all([
    ticket.messageSeenAt
      ? Promise.resolve()
      : prisma.ticket.update({ where: { id: ticket.id }, data: { messageSeenAt: new Date() } }),
    prisma.ticketReply.updateMany({
      where: { ticketId: ticket.id, authorId: ticket.userId, seenAt: null },
      data: { seenAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
