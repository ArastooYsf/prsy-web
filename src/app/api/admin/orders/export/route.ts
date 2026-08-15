import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildExcelResponse, type ExcelColumn } from "@/lib/excel-export";
import { ORDER_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import { dateRangeWhere, param } from "@/lib/list-query";
import type { Order, OrderItem, User } from "@/generated/prisma/client";

type OrderRow = Order & { user: User; items: OrderItem[] };

const columns: ExcelColumn<OrderRow>[] = [
  { header: "شماره سفارش", value: (o) => o.orderNumber, width: 20 },
  { header: "مشتری", value: (o) => o.user.name || o.user.email, width: 26 },
  { header: "تعداد اقلام", value: (o) => o.items.length, width: 12 },
  { header: "وضعیت", value: (o) => ORDER_STATUS[o.status]?.label ?? o.status, width: 18 },
  { header: "تاریخ ثبت", value: (o) => formatJalali(o.createdAt), width: 16 },
];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const status = param(searchParams, "status");
  const q = param(searchParams, "q");
  const createdRange = dateRangeWhere(searchParams, "from", "to");

  const orders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status: status as never } : {}),
      ...(createdRange ? { createdAt: createdRange } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q } },
              { user: { name: { contains: q } } },
              { user: { email: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true },
  });

  return buildExcelResponse("سفارش‌ها", "سفارش‌ها.xlsx", columns, orders);
}
