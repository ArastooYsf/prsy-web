import Link from "next/link";
import { getServerSession } from "next-auth";
import { Eye, FileSpreadsheet, Pencil, Plus, ScrollText } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import { dateRangeWhere, filterQueryString, param, sortParams, type ListSearchParams } from "@/lib/list-query";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
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
  const startRange = dateRangeWhere(searchParams, "startFrom", "startTo");
  const endRange = dateRangeWhere(searchParams, "endFrom", "endTo");
  const { field, dir } = sortParams(searchParams, SORT_FIELDS, "createdAt");

  const [contracts, typeRows] = await Promise.all([
    prisma.contract.findMany({
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
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <FileSpreadsheet className="size-4" />
            دانلود اکسل
          </a>
          {isAdmin && (
            <Link
              href="/account/admin/contracts/new"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
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
        dateRanges={[
          { fromKey: "startFrom", toKey: "startTo", label: "بازه‌ی تاریخ شروع" },
          { fromKey: "endFrom", toKey: "endTo", label: "بازه‌ی تاریخ پایان" },
        ]}
      />

      {contracts.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          قراردادی با این مشخصات یافت نشد.
        </p>
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {contracts.map((contract) => (
              <div key={contract.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{contract.title}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_STATUS[contract.status].className}`}
                  >
                    {CONTRACT_STATUS[contract.status].label}
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">مشتری</dt>
                    <dd className="text-foreground/70">{contract.user.name || contract.user.email}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">نوع</dt>
                    <dd className="text-foreground/70">{contract.type}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">شروع</dt>
                    <dd dir="ltr" className="text-foreground/70">
                      {formatJalali(contract.startDate)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">پایان</dt>
                    <dd dir="ltr" className="text-foreground/70">
                      {formatJalali(contract.endDate)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                  <Link
                    href={`/account/admin/contracts/${contract.id}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                  >
                    {isAdmin ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
                    {isAdmin ? "ویرایش" : "مشاهده"}
                  </Link>
                  {isAdmin && (
                    <DeleteEntityButton
                      endpoint={`/api/admin/contracts/${contract.id}`}
                      title="حذف قرارداد"
                      message={`مطمئنید می‌خواهید قرارداد «${contract.title}» را حذف کنید؟`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden rounded-2xl border border-white/10 md:block">
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
                  <tr key={contract.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium">{contract.title}</td>
                    <td className="px-4 py-3 text-foreground/70">{contract.user.name || contract.user.email}</td>
                    <td className="px-4 py-3 text-foreground/70">{contract.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_STATUS[contract.status].className}`}
                      >
                        {CONTRACT_STATUS[contract.status].label}
                      </span>
                    </td>
                    <td dir="ltr" className="px-4 py-3 text-right text-xs text-foreground/50">
                      {formatJalali(contract.startDate)}
                    </td>
                    <td dir="ltr" className="px-4 py-3 text-right text-xs text-foreground/50">
                      {formatJalali(contract.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/account/admin/contracts/${contract.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                        >
                          {isAdmin ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
                          {isAdmin ? "ویرایش" : "مشاهده"}
                        </Link>
                        {isAdmin && (
                          <DeleteEntityButton
                            endpoint={`/api/admin/contracts/${contract.id}`}
                            title="حذف قرارداد"
                            message={`مطمئنید می‌خواهید قرارداد «${contract.title}» را حذف کنید؟`}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
