"use client";

import dynamic from "next/dynamic";
import Skeleton from "react-loading-skeleton";

// recharts (+ its d3 dependencies) is one of the heaviest packages in this
// project's bundle. The admin dashboard is the only page that needs it, and
// Next already keeps it out of every other route's bundle — but within this
// page it was still blocking hydration of the stat cards above the fold.
// Loading it on the client only, after the rest of the page is interactive,
// trades a brief chart skeleton for a faster Time to Interactive.
const chartSkeleton = () => <Skeleton height={320} borderRadius={16} className="border border-foreground/10" />;

export const TrendChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.TrendChart), {
  ssr: false,
  loading: chartSkeleton,
});

export const OrderStatusChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.OrderStatusChart), {
  ssr: false,
  loading: chartSkeleton,
});

export const TicketStatusChart = dynamic(() => import("@/components/admin/DashboardCharts").then((m) => m.TicketStatusChart), {
  ssr: false,
  loading: chartSkeleton,
});
