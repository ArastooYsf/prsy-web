import Link from "next/link";
import { getServerSession } from "next-auth";
import { FileSpreadsheet, Import, UserCheck, UserPlus, Users } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_TYPE, APPROVAL_STATUS } from "@/lib/status-labels";
import { filterQueryString, param, sortParams, type ListSearchParams } from "@/lib/list-query";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { CustomerCardMobile, CustomerRowDesktop } from "./CustomerRow";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const SORT_FIELDS = ["name", "email", "customerType", "approvalStatus", "createdAt"] as const;

function buildOrderBy(field: (typeof SORT_FIELDS)[number], dir: "asc" | "desc"): Prisma.UserOrderByWithRelationInput {
  return { [field]: dir };
}

export default async function AdminCustomersPage({ searchParams }: { searchParams: ListSearchParams }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  // Defaults to the customer-only view (this page's usual purpose); an
  // explicit role filter can widen it to staff accounts too.
  const roleFilter = param(searchParams, "role");
  const customerType = param(searchParams, "customerType");
  const approvalStatus = param(searchParams, "approvalStatus");
  const q = param(searchParams, "q");
  const { field, dir } = sortParams(searchParams, SORT_FIELDS, "createdAt");
  const roleWhere = !roleFilter ? "CUSTOMER" : roleFilter === "ALL" ? undefined : (roleFilter as never);

  const [customers, pendingCount] = await Promise.all([
    prisma.user.findMany({
      where: {
        deletedAt: null,
        role: roleWhere,
        ...(customerType ? { customerType: customerType as never } : {}),
        ...(approvalStatus ? { approvalStatus: approvalStatus as never } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}),
      },
      orderBy: buildOrderBy(field, dir),
    }),
    prisma.user.count({ where: { role: "CUSTOMER", approvalStatus: "PENDING", deletedAt: null } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Users className="size-5 text-accent-400" />
          مشتریان
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/customers/export${filterQueryString(searchParams)}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <FileSpreadsheet className="size-4" />
            دانلود اکسل
          </a>
          <Link
            href="/account/admin/customers/pending"
            className="relative inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <UserCheck className="size-4" />
            درخواست‌های تأیید مشتری حقوقی
            {pendingCount > 0 && (
              <span className="mr-1.5 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/account/admin/customers/migrate"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Import className="size-4" />
            Migrate مشتریان قدیمی
          </Link>
          <Link
            href="/account/admin/customers/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            <UserPlus className="size-4" />
            افزودن مشتری
          </Link>
        </div>
      </div>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی نام، ایمیل یا تلفن..."
        selects={[
          {
            key: "role",
            label: "نقش",
            allLabel: "نقش: مشتریان (پیش‌فرض)",
            options: [
              { value: "ALL", label: "همه نقش‌ها" },
              { value: "CUSTOMER", label: "مشتری" },
              { value: "SUPPORT", label: "پشتیبان" },
              { value: "ADMIN", label: "مدیر" },
            ],
          },
          {
            key: "customerType",
            label: "نوع",
            options: Object.entries(CUSTOMER_TYPE).map(([value, t]) => ({ value, label: t.label })),
          },
          {
            key: "approvalStatus",
            label: "وضعیت تأیید",
            options: Object.entries(APPROVAL_STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
      />

      {customers.length === 0 ? (
        <EmptyState icon={<Users />} title="مشتری‌ای با این مشخصات یافت نشد." />
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {customers.map((customer) => (
              <CustomerCardMobile key={customer.id} customer={customer} isAdmin={isAdmin} />
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden rounded-2xl border border-foreground/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="name" label="نام" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="email" label="ایمیل" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="customerType" label="نوع" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="approvalStatus" label="وضعیت" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="createdAt" label="تاریخ عضویت" />
                  </th>
                  <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12" />
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <CustomerRowDesktop key={customer.id} customer={customer} isAdmin={isAdmin} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
