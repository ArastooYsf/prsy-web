import Link from "next/link";
import { getServerSession } from "next-auth";
import { Import, UserCheck, UserPlus, Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_TYPE, APPROVAL_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = customers.filter((c) => c.approvalStatus === "PENDING").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Users className="size-5 text-accent-400" />
          مشتریان
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/account/admin/customers/pending"
            className="relative inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <UserCheck className="size-4" />
            درخواست‌های تأیید مشتری حقوقی
            {pendingCount > 0 && (
              <span className="mr-1.5 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/account/admin/customers/migrate"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Import className="size-4" />
            Migrate مشتریان قدیمی
          </Link>
          <Link
            href="/account/admin/customers/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            <UserPlus className="size-4" />
            افزودن مشتری
          </Link>
        </div>
      </div>

      {customers.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز مشتری‌ای ثبت نشده است.
        </p>
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {customers.map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{customer.name || "—"}</p>
                    {customer.companyName && <p className="text-xs text-foreground/40">{customer.companyName}</p>}
                    <p dir="ltr" className="mt-0.5 truncate text-xs text-foreground/60">
                      {customer.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CUSTOMER_TYPE[customer.customerType].className}`}
                  >
                    {CUSTOMER_TYPE[customer.customerType].label}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${APPROVAL_STATUS[customer.approvalStatus].className}`}
                  >
                    {APPROVAL_STATUS[customer.approvalStatus].label}
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">تاریخ عضویت</dt>
                    <dd dir="ltr" className="text-foreground/70">
                      {formatJalali(customer.createdAt.toISOString())}
                    </dd>
                  </div>
                </dl>
                {isAdmin && (
                  <div className="mt-3 flex justify-end border-t border-white/5 pt-3">
                    <DeleteEntityButton
                      endpoint={`/api/admin/customers/${customer.id}`}
                      title="حذف مشتری"
                      message={`مطمئنید می‌خواهید مشتری «${customer.name || customer.email}» را حذف کنید؟ ورود این حساب دیگر امکان‌پذیر نخواهد بود.`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">نام</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">ایمیل</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">نوع</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">وضعیت</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">تاریخ عضویت</th>
                  <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12" />
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium">
                      {customer.name || "—"}
                      {customer.companyName && (
                        <span className="mr-1.5 text-xs text-foreground/40">({customer.companyName})</span>
                      )}
                    </td>
                    <td dir="ltr" className="px-4 py-3 text-right text-foreground/70">
                      {customer.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CUSTOMER_TYPE[customer.customerType].className}`}
                      >
                        {CUSTOMER_TYPE[customer.customerType].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${APPROVAL_STATUS[customer.approvalStatus].className}`}
                      >
                        {APPROVAL_STATUS[customer.approvalStatus].label}
                      </span>
                    </td>
                    <td dir="ltr" className="px-4 py-3 text-right text-xs text-foreground/50">
                      {formatJalali(customer.createdAt.toISOString())}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <DeleteEntityButton
                          endpoint={`/api/admin/customers/${customer.id}`}
                          title="حذف مشتری"
                          message={`مطمئنید می‌خواهید مشتری «${customer.name || customer.email}» را حذف کنید؟ ورود این حساب دیگر امکان‌پذیر نخواهد بود.`}
                        />
                      )}
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
