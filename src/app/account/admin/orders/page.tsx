import Link from "next/link";
import { getServerSession } from "next-auth";
import { FileSpreadsheet, PackagePlus, PackageSearch } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/status-labels";
import { dateRangeWhere, filterQueryString, param, sortParams, type ListSearchParams } from "@/lib/list-query";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { AdminTableScroll, AdminTh } from "@/components/admin/AdminTable";
import { OrderCardMobile, OrderRowDesktop } from "./OrderRow";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const SORT_FIELDS = ["orderNumber", "user", "items", "status", "createdAt"] as const;

function buildOrderBy(field: (typeof SORT_FIELDS)[number], dir: "asc" | "desc"): Prisma.OrderOrderByWithRelationInput {
  if (field === "user") return { user: { name: dir } };
  if (field === "items") return { items: { _count: dir } };
  return { [field]: dir };
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: ListSearchParams }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const status = param(searchParams, "status");
  const q = param(searchParams, "q");
  const createdRange = dateRangeWhere(searchParams, "from", "to");
  const { field, dir } = sortParams(searchParams, SORT_FIELDS, "createdAt");

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
    orderBy: buildOrderBy(field, dir),
    include: { user: true, items: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <PackageSearch className="size-5 text-accent-400" />
          سفارش‌ها
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/orders/export${filterQueryString(searchParams)}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <FileSpreadsheet className="size-4" />
            دانلود اکسل
          </a>
          {isAdmin && (
            <Link
              href="/account/admin/orders/new"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
            >
              <PackagePlus className="size-4" />
              ثبت سفارش جدید
            </Link>
          )}
        </div>
      </div>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی شماره سفارش یا مشتری..."
        selects={[
          {
            key: "status",
            label: "وضعیت",
            options: Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
        dateRanges={[{ fromKey: "from", toKey: "to", label: "تاریخ ثبت" }]}
      />

      {orders.length === 0 ? (
        <EmptyState icon={<PackageSearch />} title="سفارشی با این مشخصات یافت نشد." />
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <OrderCardMobile key={order.id} order={order} isAdmin={isAdmin} />
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <AdminTableScroll>
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <AdminTh corner="start">
                    <SortableHeader field="orderNumber" label="شماره سفارش" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="user" label="مشتری" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="items" label="اقلام" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="status" label="وضعیت" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="createdAt" label="تاریخ ثبت" />
                  </AdminTh>
                  <AdminTh corner="end" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRowDesktop key={order.id} order={order} isAdmin={isAdmin} />
                ))}
              </tbody>
            </table>
          </AdminTableScroll>
        </>
      )}
    </div>
  );
}
