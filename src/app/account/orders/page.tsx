import Link from "next/link";
import { getServerSession } from "next-auth";
import { Package, Plus, Ban } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/status-labels";
import { formatNumber } from "@/lib/format-number";
import StatusBadge from "@/components/ui/StatusBadge";
import { debugSlowLoad } from "@/lib/debug-slow-load";

export const dynamic = "force-dynamic";

function newOrderTicketHref() {
  const subject = "ثبت سفارش جدید";
  const message = "با سلام،\nمایل به ثبت یک سفارش جدید هستم. لطفاً برای هماهنگی جزئیات با من تماس بگیرید.";
  return `/account/tickets/new?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
}

function cancelOrderTicketHref(order: { orderNumber: string }) {
  const subject = "درخواست لغو سفارش";
  const message = `با سلام،\nدرخواست لغو سفارش شماره «${order.orderNumber}» را دارم. لطفاً بررسی و پیگیری کنید.`;
  return `/account/tickets/new?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
}

export default async function AccountOrdersPage() {
  await debugSlowLoad();

  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const orders = await prisma.order.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Package className="size-5 text-accent-400" />
          سفارش‌ها
        </h2>
        <Link
          href={newOrderTicketHref()}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          ثبت سفارش جدید
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="هنوز سفارشی برای شما ثبت نشده است."
          description="وقتی تیم ما سفارشی براتون ثبت کنه، همین‌جا نمایش داده می‌شه."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 transition-colors hover:border-accent-500/30"
            >
              <Link href={`/account/orders/${order.id}`} className="min-w-0 flex-1">
                <p dir="ltr" className="text-right font-semibold">
                  {order.orderNumber}
                </p>
                <p className="mt-1 text-xs text-foreground/50">{formatNumber(order.items.length)} قلم کالا</p>
                <p dir="ltr" className="mt-1 text-right text-xs text-foreground/50">
                  {order.createdAt.toLocaleDateString("fa-IR")}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                <StatusBadge status={ORDER_STATUS[order.status]} />
                {(order.status === "PENDING" || order.status === "PROCESSING") && (
                  <Link
                    href={cancelOrderTicketHref(order)}
                    className="flex min-h-11 items-center gap-1.5 rounded-full border border-red-500/30 px-4 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Ban className="size-3.5" />
                    لغو سفارش
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
