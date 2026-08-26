"use client";

import dynamic from "next/dynamic";
import Skeleton from "react-loading-skeleton";

// Same rationale as DashboardChartsLazy.tsx: recharts is heavy, this page is
// the only place on this route that needs it, so it loads client-side only
// after the rest of the dashboard (stat cards, speed-test button) is already
// interactive.
const chartSkeleton = () => <Skeleton height={264} borderRadius={16} className="border border-foreground/10" />;

export const LogEventsTrendChart = dynamic(
  () => import("@/components/admin/LogsDashboardCharts").then((m) => m.LogEventsTrendChart),
  { ssr: false, loading: chartSkeleton },
);

export const LighthouseTrendChart = dynamic(
  () => import("@/components/admin/LogsDashboardCharts").then((m) => m.LighthouseTrendChart),
  { ssr: false, loading: chartSkeleton },
);
