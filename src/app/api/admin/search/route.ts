import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RESULT_LIMIT = 5;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const empty = { items: [], hasMore: false };
  if (q.length < 2) {
    return NextResponse.json({ customers: empty, tickets: empty, contracts: empty, orders: empty });
  }

  const [customers, tickets, contracts, orders] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        deletedAt: null,
        OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
      },
      select: { id: true, name: true, email: true },
      take: RESULT_LIMIT + 1,
    }),
    prisma.ticket.findMany({
      where: { deletedAt: null, subject: { contains: q } },
      select: { id: true, subject: true },
      take: RESULT_LIMIT + 1,
    }),
    prisma.contract.findMany({
      where: { deletedAt: null, title: { contains: q } },
      select: { id: true, title: true },
      take: RESULT_LIMIT + 1,
    }),
    prisma.order.findMany({
      where: { deletedAt: null, orderNumber: { contains: q } },
      select: { id: true, orderNumber: true },
      take: RESULT_LIMIT + 1,
    }),
  ]);

  const cap = <T,>(rows: T[]) => ({ items: rows.slice(0, RESULT_LIMIT), hasMore: rows.length > RESULT_LIMIT });

  return NextResponse.json({
    customers: cap(customers),
    tickets: cap(tickets),
    contracts: cap(contracts),
    orders: cap(orders),
  });
}
