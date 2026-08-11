import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">سفارش‌ها</h2>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز سفارشی برای شما ثبت نشده است.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-accent-500/30"
            >
              <div>
                <p dir="ltr" className="text-right font-semibold">
                  {order.orderNumber}
                </p>
                <p className="mt-1 text-xs text-foreground/50">{order.items.length} قلم کالا</p>
                <p dir="ltr" className="mt-1 text-right text-xs text-foreground/50">
                  {order.createdAt.toLocaleDateString("fa-IR")}
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ORDER_STATUS[order.status].className}`}
              >
                {ORDER_STATUS[order.status].label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
