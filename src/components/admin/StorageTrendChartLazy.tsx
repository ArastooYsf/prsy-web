"use client";

import dynamic from "next/dynamic";
import Skeleton from "react-loading-skeleton";

// Same rationale as LogsDashboardChartsLazy.tsx: recharts is heavy, load it
// client-side only after the rest of the page is already interactive.
export const StorageTrendChart = dynamic(
  () => import("@/components/admin/StorageTrendChart").then((m) => m.StorageTrendChart),
  { ssr: false, loading: () => <Skeleton height={264} borderRadius={16} className="border border-foreground/10" /> },
);
