import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_TYPE, APPROVAL_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = customers.filter((c) => c.approvalStatus === "PENDING").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">مشتریان</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/account/admin/customers/pending"
            className="relative rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            درخواست‌های تأیید مشتری حقوقی
            {pendingCount > 0 && (
              <span className="mr-1.5 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/account/admin/customers/migrate"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            Migrate مشتریان قدیمی
          </Link>
          <Link
            href="/account/admin/customers/new"
            className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            افزودن مشتری
          </Link>
        </div>
      </div>

      {customers.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز مشتری‌ای ثبت نشده است.
        </p>
      ) : (
        <div className="rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-foreground/60">
              <tr>
                <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">نام</th>
                <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">ایمیل</th>
                <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">نوع</th>
                <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">وضعیت</th>
                <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">تاریخ عضویت</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
