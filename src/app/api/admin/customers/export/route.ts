import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildExcelResponse, type ExcelColumn } from "@/lib/excel-export";
import { CUSTOMER_TYPE, APPROVAL_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import { param } from "@/lib/list-query";
import type { User } from "@/generated/prisma/client";

const columns: ExcelColumn<User>[] = [
  { header: "نام", value: (u) => u.name || "—", width: 24 },
  { header: "ایمیل", value: (u) => u.email, width: 28 },
  { header: "تلفن", value: (u) => u.phone || "—", width: 16 },
  { header: "شرکت", value: (u) => u.companyName || "—", width: 24 },
  { header: "نوع مشتری", value: (u) => CUSTOMER_TYPE[u.customerType]?.label ?? u.customerType, width: 14 },
  { header: "وضعیت تأیید", value: (u) => APPROVAL_STATUS[u.approvalStatus]?.label ?? u.approvalStatus, width: 16 },
  { header: "تاریخ عضویت", value: (u) => formatJalali(u.createdAt), width: 16 },
];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const roleFilter = param(searchParams, "role");
  const customerType = param(searchParams, "customerType");
  const approvalStatus = param(searchParams, "approvalStatus");
  const q = param(searchParams, "q");
  const roleWhere = !roleFilter ? "CUSTOMER" : roleFilter === "ALL" ? undefined : (roleFilter as never);

  const customers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: roleWhere,
      ...(customerType ? { customerType: customerType as never } : {}),
      ...(approvalStatus ? { approvalStatus: approvalStatus as never } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return buildExcelResponse("مشتریان", "مشتریان.xlsx", columns, customers);
}
