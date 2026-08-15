import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildExcelResponse, type ExcelColumn } from "@/lib/excel-export";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import { dateRangeWhere, param } from "@/lib/list-query";
import type { Contract, User } from "@/generated/prisma/client";

type ContractRow = Contract & { user: User };

const columns: ExcelColumn<ContractRow>[] = [
  { header: "عنوان", value: (c) => c.title, width: 26 },
  { header: "مشتری", value: (c) => c.user.name || c.user.email, width: 26 },
  { header: "نوع", value: (c) => c.type, width: 16 },
  { header: "وضعیت", value: (c) => CONTRACT_STATUS[c.status]?.label ?? c.status, width: 18 },
  { header: "تاریخ شروع", value: (c) => formatJalali(c.startDate), width: 16 },
  { header: "تاریخ پایان", value: (c) => formatJalali(c.endDate), width: 16 },
  { header: "تاریخ ثبت", value: (c) => formatJalali(c.createdAt), width: 16 },
];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const status = param(searchParams, "status");
  const type = param(searchParams, "type");
  const q = param(searchParams, "q");
  const startRange = dateRangeWhere(searchParams, "startFrom", "startTo");
  const endRange = dateRangeWhere(searchParams, "endFrom", "endTo");

  const contracts = await prisma.contract.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status: status as never } : {}),
      ...(type ? { type } : {}),
      ...(startRange ? { startDate: startRange } : {}),
      ...(endRange ? { endDate: endRange } : {}),
      ...(q
        ? { OR: [{ title: { contains: q } }, { user: { name: { contains: q } } }, { user: { email: { contains: q } } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return buildExcelResponse("قراردادها", "قراردادها.xlsx", columns, contracts);
}
