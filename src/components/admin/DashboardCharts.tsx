"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Eye } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import type { StatusCount, TrendPoint } from "@/lib/admin-stats";
import { ALL_STATS_RANGES, RANGE_LABELS, type StatsRange } from "@/lib/stats-range";
import { formatNumber, toPersianDigits } from "@/lib/format-number";

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "#f97316",
  PROCESSING: "#60a5fa",
  SHIPPED: "#3b82f6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: "#f97316",
  IN_PROGRESS: "#eab308",
  WAITING_REPLY: "#ef4444",
  ANSWERED: "#10b981",
  CLOSED: "#71717a",
};

const CONTRACT_COLOR = "#f97316";
const ORDER_COLOR = "#60a5fa";

// Exported so every recharts-based admin card (this file and
// LogsDashboardCharts.tsx) shares one tooltip/axis-tick treatment instead of
// each redeclaring the same style objects.
export const tooltipStyle = {
  backgroundColor: "rgb(var(--popover))",
  border: "1px solid rgb(var(--foreground) / 0.1)",
  borderRadius: 12,
  fontSize: 12,
  direction: "rtl" as const,
};

export const tooltipLabelStyle = { color: "rgb(var(--popover-foreground))" };
export const axisTick = { fill: "rgb(var(--foreground) / 0.5)", fontSize: 11 };

// `height` defaults to this file's own cards (h-64); LogsDashboardCharts.tsx
// passes a smaller value for its denser card grid.
export function ChartCard({
  title,
  action,
  height = 64,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  height?: 56 | 64;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground/80">{title}</p>
        {action}
      </div>
      <div dir="ltr" className={height === 56 ? "h-56 w-full" : "h-64 w-full"}>
        {children}
      </div>
    </div>
  );
}

// Exported so other range-filterable charts on the admin side (e.g. the logs
// dashboard's event trend) reuse this exact filter instead of rebuilding it.
export function RangeFilter({ value, onChange, disabled }: { value: StatsRange; onChange: (r: StatsRange) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {ALL_STATS_RANGES.map((r) => (
        <button
          key={r}
          type="button"
          disabled={disabled}
          onClick={() => onChange(r)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            value === r
              ? "border-accent-500/40 bg-accent-500/10 text-accent-400"
              : "border-foreground/10 text-foreground/60 hover:border-foreground/20"
          }`}
        >
          {RANGE_LABELS[r]}
        </button>
      ))}
    </div>
  );
}

export function TrendChart({ initialData, initialRange }: { initialData: TrendPoint[]; initialRange: StatsRange }) {
  const [range, setRange] = useState<StatsRange>(initialRange);
  const [data, setData] = useState<TrendPoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  const handleRangeChange = async (next: StatsRange) => {
    if (next === range) return;
    setRange(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard/trend?range=${next}`);
      if (res.ok) {
        const body = await res.json();
        setData(body.trend);
      }
    } catch {
      // Network failure: leave the previous data showing rather than
      // getting permanently stuck with every range button disabled.
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChartCard title="روند ثبت قراردادها و سفارش‌ها" action={<RangeFilter value={range} onChange={handleRangeChange} disabled={loading} />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--foreground) / 0.08)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} interval={range === "1y" || range === "all" ? 0 : "preserveStartEnd"} />
          <YAxis allowDecimals={false} tick={axisTick} width={28} tickFormatter={formatNumber} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ fill: "rgb(var(--foreground) / 0.05)" }}
            formatter={(value) => toPersianDigits(String(value ?? ""))}
          />
          <Legend wrapperStyle={{ fontSize: 12, direction: "rtl" }} />
          <Bar dataKey="contracts" name="قراردادها" fill={CONTRACT_COLOR} radius={[4, 4, 0, 0]} />
          <Bar dataKey="orders" name="سفارش‌ها" fill={ORDER_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// initialCount=null (dashboard's loading.tsx) falls back to a Skeleton in
// place of the number — the label and range toggle are static UI, never
// async, so they always render for real.
export function SiteViewsCard({ initialCount, initialRange }: { initialCount: number | null; initialRange: StatsRange }) {
  const [range, setRange] = useState<StatsRange>(initialRange);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleRangeChange = async (next: StatsRange) => {
    if (next === range) return;
    setRange(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard/pageviews?range=${next}`);
      if (res.ok) {
        const body = await res.json();
        setCount(body.count);
      }
    } catch {
      // Network failure: leave the previous count showing rather than
      // getting permanently stuck with every range button disabled.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground/60">
          <Eye className="size-4" />
          <p className="text-sm">بازدیدهای کلی سایت</p>
        </div>
        <RangeFilter value={range} onChange={handleRangeChange} disabled={loading} />
      </div>
      <p className="mt-2 text-3xl font-bold">{count !== null ? formatNumber(count) : <Skeleton width={64} height={30} />}</p>
    </div>
  );
}

export function OrderStatusChart({ data }: { data: StatusCount[] }) {
  return (
    <ChartCard title="سفارش‌ها به تفکیک وضعیت">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--foreground) / 0.08)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} />
          <YAxis allowDecimals={false} tick={axisTick} width={28} tickFormatter={formatNumber} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ fill: "rgb(var(--foreground) / 0.05)" }}
            formatter={(value) => toPersianDigits(String(value ?? ""))}
          />
          <Bar dataKey="count" name="تعداد" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={ORDER_STATUS_COLORS[entry.status] ?? "#71717a"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TicketStatusChart({ data }: { data: StatusCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ChartCard title="توزیع تیکت‌ها بر اساس وضعیت">
      {total === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-foreground/40">هنوز تیکتی ثبت نشده است.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              label={({ percent }) => toPersianDigits(`${Math.round((percent ?? 0) * 100)}%`)}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={TICKET_STATUS_COLORS[entry.status] ?? "#71717a"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(value) => toPersianDigits(String(value ?? ""))}
            />
            <Legend wrapperStyle={{ fontSize: 12, direction: "rtl" }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
