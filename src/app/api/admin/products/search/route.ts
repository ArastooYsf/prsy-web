import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_PRODUCT_SEARCH_MIN_QUERY_LENGTH,
  ADMIN_PRODUCT_SEARCH_LIMIT,
  type AdminProductSearchResult,
} from "@/lib/admin-product-search";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < ADMIN_PRODUCT_SEARCH_MIN_QUERY_LENGTH) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, name: { contains: q } },
    select: { id: true, name: true, price: true, brand: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: ADMIN_PRODUCT_SEARCH_LIMIT,
  });

  const results: AdminProductSearchResult[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand?.name ?? null,
    price: p.price,
  }));

  return NextResponse.json({ products: results });
}
