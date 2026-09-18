"use client";

import dynamic from "next/dynamic";
import Skeleton from "react-loading-skeleton";

// recharts (+ its d3 dependencies) is one of the heaviest packages in this
// project's bundle. The admin dashboard is the only page that needs it, and
// Next already keeps it out of every other route's bundle — but within this
// page it was still blocking hydration of the stat cards above the fold.
// Loading it on the client only, after the rest of the page is interactive,
// trades a brief chart skeleton for a faster Time to Interactive.
//
// These fallbacks reproduce `ChartCard`'s own wrapper markup (padding,
// header row, h-64 content area) instead of a single flat
// `<Skeleton height={320}>` — importing the real `ChartCard` from
// DashboardCharts.tsx isn't an option (that would eagerly pull in the very
// chunk this file exists to defer), so the shape is duplicated here on
// purpose. Without matching the real title row's own height (plain text for
// the two status charts, a `min-h-11` <select> action for TrendChart), the
// swap from skeleton to real chart popped the title/dropdown in and shifted
// the chart down by however tall that row turned out to be — this keeps the
// reserved space identical on both sides of the swap, so only the *content*
// inside each slot changes, not the layout around it.
function ChartCardSkeleton({ withAction }: { withAction?: boolean }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Skeleton width={160} height={14} />
        {withAction && <Skeleton width={104} height={44} borderRadius={8} />}
      </div>
      <Skeleton height={256} borderRadius={12} />
    </div>
  );
}

const trendChartSkeleton = () => <ChartCardSkeleton withAction />;
const statusChartSkeleton = () => <ChartCardSkeleton />;

export const TrendChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.TrendChart), {
  ssr: false,
  loading: trendChartSkeleton,
});

export const OrderStatusChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.OrderStatusChart), {
  ssr: false,
  loading: statusChartSkeleton,
});

export const TicketStatusChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.TicketStatusChart), {
  ssr: false,
  loading: statusChartSkeleton,
});
