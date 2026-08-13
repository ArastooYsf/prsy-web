import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findFirst({ where: { id: params.id, userId: session.user.id, deletedAt: null } });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  await prisma.ticketReply.updateMany({
    where: { ticketId: ticket.id, authorId: { not: session.user.id }, seenAt: null },
    data: { seenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
