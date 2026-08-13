import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  await prisma.ticket.update({ where: { id: ticket.id }, data: { staffTypingAt: new Date() } });

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, deletedAt: null },
    select: { customerTypingAt: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ typingAt: ticket.customerTypingAt });
}
