import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_CUSTOMER_SEARCH_MIN_QUERY_LENGTH,
  ADMIN_CUSTOMER_SEARCH_LIMIT,
  type AdminCustomerSearchResult,
} from "@/lib/admin-customer-search";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < ADMIN_CUSTOMER_SEARCH_MIN_QUERY_LENGTH) {
    return NextResponse.json({ customers: [] });
  }

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      deletedAt: null,
      OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
    },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { name: "asc" },
    take: ADMIN_CUSTOMER_SEARCH_LIMIT,
  });

  const results: AdminCustomerSearchResult[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
  }));

  return NextResponse.json({ customers: results });
}
