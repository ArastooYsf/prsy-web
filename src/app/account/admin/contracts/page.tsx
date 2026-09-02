import Link from "next/link";
import { getServerSession } from "next-auth";
import { FileSpreadsheet, Plus, ScrollText } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import { dateOnwardsWhere, filterQueryString, param, sortParams, type ListSearchParams } from "@/lib/list-query";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { ContractCardMobile, ContractRowDesktop } from "./ContractRow";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const SORT_FIELDS = ["title", "user", "type", "status", "startDate", "endDate", "createdAt"] as const;

function buildOrderBy(field: (typeof SORT_FIELDS)[number], dir: "asc" | "desc"): Prisma.ContractOrderByWithRelationInput {
  if (field === "user") return { user: { name: dir } };
  return { [field]: dir };
}

export default async function AdminContractsPage({ searchParams }: { searchParams: ListSearchParams }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const status = param(searchParams, "status");
  const type = param(searchParams, "type");
  const q = param(searchParams, "q");
  const startFrom = dateOnwardsWhere(searchParams, "startDate");
  const endFrom = dateOnwardsWhere(searchParams, "endDate");
  const { field, dir } = sortParams(searchParams, SORT_FIELDS, "createdAt");

  const [contracts, typeRows] = await Promise.all([
    prisma.contract.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as never } : {}),
        ...(type ? { type } : {}),
        ...(startFrom ? { startDate: startFrom } : {}),
        ...(endFrom ? { endDate: endFrom } : {}),
        ...(q
          ? { OR: [{ title: { contains: q } }, { user: { name: { contains: q } } }, { user: { email: { contains: q } } }] }
          : {}),
      },
      orderBy: buildOrderBy(field, dir),
      include: { user: true },
    }),
    prisma.contract.findMany({ where: { deletedAt: null }, distinct: ["type"], select: { type: true }, orderBy: { type: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ScrollText className="size-5 text-accent-400" />
          قراردادها
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/contracts/export${filterQueryString(searchParams)}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <FileSpreadsheet className="size-4" />
            دانلود اکسل
          </a>
          {isAdmin && (
            <Link
              href="/account/admin/contracts/new"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
            >
              <Plus className="size-4" />
              ثبت قرارداد جدید
            </Link>
          )}
        </div>
      </div>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی عنوان یا مشتری..."
        selects={[
          {
            key: "status",
            label: "وضعیت",
            options: Object.entries(CONTRACT_STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
          {
            key: "type",
            label: "نوع قرارداد",
            options: typeRows.map((t) => ({ value: t.type, label: t.type })),
          },
        ]}
        dates={[
          { key: "startDate", label: "تاریخ شروع" },
          { key: "endDate", label: "تاریخ پایان" },
        ]}
      />

      {contracts.length === 0 ? (
        <EmptyState icon={<ScrollText />} title="قراردادی با این مشخصات یافت نشد." />
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {contracts.map((contract) => (
              <ContractCardMobile key={contract.id} contract={contract} isAdmin={isAdmin} />
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden rounded-2xl border border-foreground/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="title" label="عنوان" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="user" label="مشتری" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="type" label="نوع" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="status" label="وضعیت" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="startDate" label="شروع" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="endDate" label="پایان" />
                  </th>
                  <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12"></th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <ContractRowDesktop key={contract.id} contract={contract} isAdmin={isAdmin} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
