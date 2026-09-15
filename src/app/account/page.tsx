import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS, CONTRACT_STATUS, ORDER_STATUS } from "@/lib/status-labels";
import StatusBadge from "@/components/ui/StatusBadge";
import { debugSlowLoad } from "@/lib/debug-slow-load";

export const dynamic = "force-dynamic";

const dateFmt = (d: Date) => d.toLocaleDateString("fa-IR");

export default async function AccountOverviewPage() {
  await debugSlowLoad();

  const session = await getServerSession(authOptions);

  // Personal stats (open tickets/active contracts/orders) only apply to a
  // CUSTOMER; ADMIN/SUPPORT's real landing page is the management dashboard.
  if (session!.user.role === "ADMIN" || session!.user.role === "SUPPORT") {
    redirect("/account/admin");
  }

  const userId = session!.user.id;

  const [recentTickets, recentContracts, recentOrders] = await Promise.all([
    prisma.ticket.findMany({ where: { userId, deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.contract.findMany({ where: { userId, deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.order.findMany({ where: { userId, deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  const activity = [
    ...recentTickets.map((t) => ({
      key: `ticket-${t.id}`,
      href: `/account/tickets/${t.id}`,
      title: `تیکت: ${t.subject}`,
      updatedAt: t.updatedAt,
      badge: TICKET_STATUS[t.status],
    })),
    ...recentContracts.map((c) => ({
      key: `contract-${c.id}`,
      href: `/account/contracts`,
      title: `قرارداد: ${c.title}`,
      updatedAt: c.updatedAt,
      badge: CONTRACT_STATUS[c.status],
    })),
    ...recentOrders.map((o) => ({
      key: `order-${o.id}`,
      href: `/account/orders/${o.id}`,
      title: `سفارش: ${o.orderNumber}`,
      updatedAt: o.updatedAt,
      badge: ORDER_STATUS[o.status],
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
        <h2 className="text-base font-bold">آخرین فعالیت‌ها</h2>
        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">هنوز فعالیتی ثبت نشده است.</p>
        ) : (
          <div className="mt-4 divide-y divide-foreground/10">
            {activity.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center justify-between gap-4 py-3.5 text-sm transition-colors hover:text-accent-400"
              >
                <span>{item.title}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={item.badge} />
                  <span dir="ltr" className="text-foreground/50">
                    {dateFmt(item.updatedAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
