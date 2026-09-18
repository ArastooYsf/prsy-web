import { ImageIcon, LayoutTemplate, Newspaper, type LucideIcon } from "lucide-react";
import { SiteViewsCard } from "@/components/admin/DashboardCharts";
import { TrendChart, OrderStatusChart, TicketStatusChart } from "@/components/admin/DashboardChartsLazy";
import { StatCard } from "./StatCard";

// Which 3 cards show depends on role (ADMIN vs SUPPORT), which needs a
// session lookup we can't do synchronously here — the ADMIN set is the more
// common viewer and only the value column (Skeleton) is shown anyway.
const CARDS: { label: string; icon: LucideIcon }[] = [
  { label: "پست‌های وبلاگ", icon: Newspaper },
  { label: "محصولات سایت", icon: LayoutTemplate },
  { label: "فایل‌های آپلودشده", icon: ImageIcon },
];

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => (
          <StatCard key={card.label} label={card.label} value={null} icon={card.icon} />
        ))}
        <SiteViewsCard initialCount={null} initialRange="30d" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart initialData={[]} initialRange="30d" />
        </div>
        <TicketStatusChart data={[]} />
        <div className="lg:col-span-3">
          <OrderStatusChart data={[]} />
        </div>
      </div>
    </div>
  );
}
