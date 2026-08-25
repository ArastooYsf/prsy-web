import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText, MessageSquare, Package, type LucideIcon } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS, CONTRACT_STATUS, ORDER_STATUS } from "@/lib/status-labels";
import { formatNumber } from "@/lib/format-number";

export const dynamic = "force-dynamic";

const dateFmt = (d: Date) => d.toLocaleDateString("fa-IR");

export default async function AccountOverviewPage() {
  const session = await getServerSession(authOptions);

  // Personal stats (open tickets/active contracts/orders) only apply to a
  // CUSTOMER; ADMIN/SUPPORT's real landing page is the management dashboard.
  if (session!.user.role === "ADMIN" || session!.user.role === "SUPPORT") {
    redirect("/account/admin");
  }

  const userId = session!.user.id;

  const [openTicketsCount, activeContractsCount, activeOrdersCount, recentTickets, recentContracts, recentOrders] =
    await Promise.all([
      prisma.ticket.count({ where: { userId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_REPLY"] }, deletedAt: null } }),
      prisma.contract.count({ where: { userId, status: "ACTIVE", deletedAt: null } }),
      prisma.order.count({ where: { userId, status: { in: ["PENDING", "PROCESSING", "SHIPPED"] }, deletedAt: null } }),
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

  const stats: { label: string; value: number; href: string; icon: LucideIcon }[] = [
    { label: "تیکت‌های باز", value: openTicketsCount, href: "/account/tickets", icon: MessageSquare },
    { label: "قراردادهای فعال", value: activeContractsCount, href: "/account/contracts", icon: FileText },
    { label: "سفارش‌های در جریان", value: activeOrdersCount, href: "/account/orders", icon: Package },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 transition-colors hover:border-accent-500/30"
          >
            <div className="flex items-center gap-2 text-foreground/60">
              <stat.icon className="size-4" />
              <p className="text-sm">{stat.label}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-accent-400">{formatNumber(stat.value)}</p>
          </Link>
        ))}
      </div>

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
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${item.badge.className}`}
                  >
                    {item.badge.label}
                  </span>
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
