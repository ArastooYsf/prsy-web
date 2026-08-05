import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">سفارش‌ها</h2>
        {isAdmin && (
          <Link
            href="/admin/orders/new"
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
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-foreground/60">
              <tr>
                <th className="px-4 py-3 text-right font-medium">شماره سفارش</th>
                <th className="px-4 py-3 text-right font-medium">مشتری</th>
                <th className="px-4 py-3 text-right font-medium">اقلام</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-white/10">
                  <td dir="ltr" className="px-4 py-3 text-left font-medium">
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
                  <td className="px-4 py-3 text-left">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                    >
                      {isAdmin ? "ویرایش" : "مشاهده"}
                    </Link>
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
