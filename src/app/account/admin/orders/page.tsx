import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/status-labels";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">سفارش‌ها</h2>
        {isAdmin && (
          <Link
            href="/account/admin/orders/new"
            className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            ثبت سفارش جدید
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز سفارشی ثبت نشده است.
        </p>
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p dir="ltr" className="text-right font-medium">
                    {order.orderNumber}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ORDER_STATUS[order.status].className}`}
                  >
                    {ORDER_STATUS[order.status].label}
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">مشتری</dt>
                    <dd className="text-foreground/70">{order.user.name || order.user.email}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">اقلام</dt>
                    <dd className="text-foreground/70">{order.items.length} قلم</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                  <Link
                    href={`/account/admin/orders/${order.id}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                  >
                    {isAdmin ? "ویرایش" : "مشاهده"}
                  </Link>
                  {isAdmin && (
                    <DeleteEntityButton
                      endpoint={`/api/admin/orders/${order.id}`}
                      title="حذف سفارش"
                      message={`مطمئنید می‌خواهید سفارش «${order.orderNumber}» را حذف کنید؟`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">شماره سفارش</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">مشتری</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">اقلام</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">وضعیت</th>
                  <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-white/10">
                    <td dir="ltr" className="px-4 py-3 text-right font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-foreground/70">{order.user.name || order.user.email}</td>
                    <td className="px-4 py-3 text-foreground/70">{order.items.length} قلم</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ORDER_STATUS[order.status].className}`}
                      >
                        {ORDER_STATUS[order.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/account/admin/orders/${order.id}`}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                        >
                          {isAdmin ? "ویرایش" : "مشاهده"}
                        </Link>
                        {isAdmin && (
                          <DeleteEntityButton
                            endpoint={`/api/admin/orders/${order.id}`}
                            title="حذف سفارش"
                            message={`مطمئنید می‌خواهید سفارش «${order.orderNumber}» را حذف کنید؟`}
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
