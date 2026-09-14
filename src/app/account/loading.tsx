import { FileText, MessageSquare, Package, type LucideIcon } from "lucide-react";
import Skeleton from "react-loading-skeleton";

const STATS: { label: string; icon: LucideIcon }[] = [
  { label: "تیکت‌های باز", icon: MessageSquare },
  { label: "قراردادهای فعال", icon: FileText },
  { label: "سفارش‌های در جریان", icon: Package },
];

// The real page shows up to 6 (see `.slice(0, 6)` in page.tsx).
const PLACEHOLDER_ACTIVITY = Array.from({ length: 6 });

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6">
            <div className="flex items-center gap-2 text-foreground/60">
              <stat.icon className="size-4" />
              <p className="text-sm">{stat.label}</p>
            </div>
            <Skeleton width={48} height={30} containerClassName="block mt-2" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
        <h2 className="text-base font-bold">آخرین فعالیت‌ها</h2>
        <div className="mt-4 divide-y divide-foreground/10">
          {PLACEHOLDER_ACTIVITY.map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3.5 text-sm">
              <Skeleton width={160} height={14} />
              <span className="flex shrink-0 items-center gap-3">
                <Skeleton width={80} height={22} borderRadius={9999} />
                <Skeleton width={60} height={12} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
