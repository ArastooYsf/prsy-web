import { getServerSession } from "next-auth";
import { Headset, Image as ImageIcon, LayoutTemplate, Newspaper, PackageSearch, ScrollText, type LucideIcon } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format-number";
import { getContractOrderTrend, getOrderStatusBreakdown, getTicketStatusBreakdown, getPageViewCount } from "@/lib/admin-stats";
import UploadWidget from "@/components/admin/UploadWidget";
import { SiteViewsCard } from "@/components/admin/DashboardCharts";
import { TrendChart, OrderStatusChart, TicketStatusChart } from "@/components/admin/DashboardChartsLazy";

async function getAdminStats() {
  try {
    const [posts, contentEntries, media] = await Promise.all([
      prisma.blogPost.count(),
      prisma.siteContent.count(),
      prisma.mediaAsset.count(),
    ]);
    return { posts, contentEntries, media, error: null as string | null };
  } catch {
    return {
      posts: 0,
      contentEntries: 0,
      media: 0,
      error: "اتصال به دیتابیس برقرار نیست. تنظیمات DATABASE_URL را بررسی کنید.",
    };
  }
}

async function getSupportStats() {
  const [openTickets, activeContracts, activeOrders] = await Promise.all([
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_REPLY"] }, deletedAt: null } }),
    prisma.contract.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING", "SHIPPED"] }, deletedAt: null } }),
  ]);
  return { openTickets, activeContracts, activeOrders };
}

async function getChartData() {
  const [trend, orderStatusBreakdown, ticketStatusBreakdown, pageViews] = await Promise.all([
    getContractOrderTrend("30d"),
    getOrderStatusBreakdown(),
    getTicketStatusBreakdown(),
    getPageViewCount("30d"),
  ]);
  return { trend, orderStatusBreakdown, ticketStatusBreakdown, pageViews };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const charts = await getChartData();

  if (session!.user.role !== "ADMIN") {
    const stats = await getSupportStats();
    const cards: { label: string; value: number; icon: LucideIcon }[] = [
      { label: "تیکت‌های باز", value: stats.openTickets, icon: Headset },
      { label: "قراردادهای فعال", value: stats.activeContracts, icon: ScrollText },
      { label: "سفارش‌های در جریان", value: stats.activeOrders, icon: PackageSearch },
    ];

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2 text-foreground/60">
                <card.icon className="size-4" />
                <p className="text-sm">{card.label}</p>
              </div>
              <p className="mt-2 text-3xl font-black">{formatNumber(card.value)}</p>
            </div>
          ))}
          <SiteViewsCard initialCount={charts.pageViews} initialRange="30d" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrendChart initialData={charts.trend} initialRange="30d" />
          </div>
          <TicketStatusChart data={charts.ticketStatusBreakdown} />
          <div className="lg:col-span-3">
            <OrderStatusChart data={charts.orderStatusBreakdown} />
          </div>
        </div>
      </div>
    );
  }

  const stats = await getAdminStats();

  const cards: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "پست‌های وبلاگ", value: stats.posts, icon: Newspaper },
    { label: "محصولات سایت", value: stats.contentEntries, icon: LayoutTemplate },
    { label: "فایل‌های آپلودشده", value: stats.media, icon: ImageIcon },
  ];

  return (
    <div className="space-y-8">
      {stats.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {stats.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2 text-foreground/60">
              <card.icon className="size-4" />
              <p className="text-sm">{card.label}</p>
            </div>
            <p className="mt-2 text-3xl font-black">{card.value}</p>
          </div>
        ))}
        <SiteViewsCard initialCount={charts.pageViews} initialRange="30d" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart initialData={charts.trend} initialRange="30d" />
        </div>
        <TicketStatusChart data={charts.ticketStatusBreakdown} />
        <div className="lg:col-span-3">
          <OrderStatusChart data={charts.orderStatusBreakdown} />
        </div>
      </div>

      <UploadWidget />
    </div>
  );
}
