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

type LegendEntry = { value?: unknown; color?: string; dataKey?: unknown };

// Replaces recharts' built-in <Legend> markup, which lays entries out as
// fixed inline-blocks (swatch overlapping the next label under our RTL text,
// no wrapping on narrow cards). Plain flex-wrap: entries reflow onto extra
// lines on mobile, and recharts measures this element, so the plot shrinks to
// make room instead of the legend overlapping it. Text stays in ink colour —
// the swatch alone carries the series colour. Passing `onToggle` turns the
// entries into show/hide buttons (the logs chart).
export function ChartLegend({
  payload,
  hidden,
  onToggle,
}: {
  payload?: readonly LegendEntry[];
  hidden?: ReadonlySet<string>;
  onToggle?: (dataKey: string) => void;
}) {
  return (
    <ul dir="rtl" className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-foreground/70">
      {(payload ?? []).map((entry, i) => {
        const key = String(entry.dataKey ?? entry.value ?? i);
        const off = hidden?.has(key);
        const body = (
          <>
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: entry.color, opacity: off ? 0.35 : 1 }} />
            <span className={off ? "opacity-40" : undefined}>{String(entry.value ?? "")}</span>
          </>
        );
        return (
          <li key={key}>
            {onToggle ? (
              <button type="button" onClick={() => onToggle(key)} aria-pressed={!off} className="inline-flex items-center gap-1.5 rounded px-1 py-1">
                {body}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 py-1">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Percent label centred in the donut ring (not outside it, where it landed
// on the dark card background in default text colour). Rendered by recharts
// after every sector, so it always paints above them. Slices under
// MIN_LABEL_PERCENT are too thin to hold text without spilling onto a
// neighbour — their exact value is in the tooltip instead.
const MIN_LABEL_PERCENT = 0.06;
function renderRingLabel(props: { cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number }) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  if (percent < MIN_LABEL_PERCENT) return null;
  const r = (innerRadius + outerRadius) / 2;
  const rad = (-midAngle * Math.PI) / 180;
  return (
    <text
      x={cx + r * Math.cos(rad)}
      y={cy + r * Math.sin(rad)}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      fill="#fff"
      stroke="rgba(0,0,0,0.55)"
      strokeWidth={3}
      paintOrder="stroke"
      pointerEvents="none"
    >
      {toPersianDigits(`${Math.round(percent * 100)}%`)}
    </text>
  );
}

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
// A single dropdown instead of a row of pill buttons — these 5 options are
// mutually exclusive (exactly one active range), which a <select> expresses
// directly instead of needing a wide button group repeated on every chart card.
export function RangeFilter({
  value,
  onChange,
  disabled,
  ariaLabel = "بازه‌ی زمانی",
}: {
  value: StatsRange;
  onChange: (r: StatsRange) => void;
  disabled?: boolean;
  /** The button group this replaced sat visibly under the chart's own title,
   * so its purpose was obvious; a bare <select> needs its own accessible
   * name instead of relying on nearby text a screen reader won't associate with it. */
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StatsRange)}
      aria-label={ariaLabel}
      className="min-h-11 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-xs font-medium text-foreground/70 outline-none transition-colors focus:border-accent-500/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {ALL_STATS_RANGES.map((r) => (
        <option key={r} value={r} className="bg-background">
          {RANGE_LABELS[r]}
        </option>
      ))}
    </select>
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
    <ChartCard
      title="روند ثبت قراردادها و سفارش‌ها"
      action={<RangeFilter value={range} onChange={handleRangeChange} disabled={loading} ariaLabel="بازه‌ی زمانی روند ثبت قراردادها و سفارش‌ها" />}
    >
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
          <Legend content={(p) => <ChartLegend payload={p.payload} />} />
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
        <RangeFilter value={range} onChange={handleRangeChange} disabled={loading} ariaLabel="بازه‌ی زمانی بازدیدهای کلی سایت" />
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
  // A 0-count status would still claim a padding gap (and a legend row) for
  // a slice with nothing in it.
  const slices = data.filter((d) => d.count > 0);

  return (
    <ChartCard title="توزیع تیکت‌ها بر اساس وضعیت">
      {total === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-foreground/40">هنوز تیکتی ثبت نشده است.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="label"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              label={renderRingLabel}
              labelLine={false}
            >
              {slices.map((entry) => (
                <Cell key={entry.status} fill={TICKET_STATUS_COLORS[entry.status] ?? "#71717a"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(value) => toPersianDigits(String(value ?? ""))}
            />
            <Legend content={(p) => <ChartLegend payload={p.payload} />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
