"use client";

import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber, toPersianDigits } from "@/lib/format-number";
import { scoreTierHex } from "@/lib/score-tier";
import { axisTick, ChartCard, ChartLegend, RangeFilter, tooltipLabelStyle, tooltipStyle } from "@/components/admin/DashboardCharts";
import { CATEGORY_META } from "@/components/admin/LogCategoryMeta";
import { jalaliDayLabel, type StatsRange } from "@/lib/stats-range";
import { ALL_LOG_CATEGORIES, CATEGORY_LABELS_FA, type LogCategory } from "@/lib/log-types";
import type { CategoryTrendPoint } from "@/lib/log-stats";
import type { LighthouseRun, LighthouseStrategy } from "@/lib/lighthouse";

// One line per log category, all sharing an axis — replaces what used to be
// two separate single-series 30-day-only charts (crash, warning). A time
// range filter (same RangeFilter used elsewhere in the admin dashboard) and
// a click-to-toggle legend (standard recharts pattern) let an admin isolate
// one category or compare all of them. Line colors come straight from
// CATEGORY_META (LogCategoryMeta.tsx) — the same source the file-list
// badges and detail-page tint already use — so a category never reads as a
// different color here than anywhere else in the logs UI.
export function LogEventsTrendChart({ initialData, initialRange }: { initialData: CategoryTrendPoint[]; initialRange: StatsRange }) {
  const [range, setRange] = useState<StatsRange>(initialRange);
  const [data, setData] = useState<CategoryTrendPoint[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState<Set<LogCategory>>(new Set());

  const handleRangeChange = async (next: StatsRange) => {
    if (next === range) return;
    setRange(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs/trend?range=${next}`);
      if (res.ok) {
        const body = await res.json();
        setData(body.data);
      }
    } catch {
      // Network failure: leave the previous data/range showing rather than
      // getting stuck — the finally below still clears `loading` either way.
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: LogCategory) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const total = data.reduce((sum, point) => sum + ALL_LOG_CATEGORIES.reduce((s, c) => s + point[c], 0), 0);

  return (
    <ChartCard
      title="روند رویدادهای لاگ"
      height={56}
      action={<RangeFilter value={range} onChange={handleRangeChange} disabled={loading} ariaLabel="بازه‌ی زمانی روند رویدادهای لاگ" />}
    >
      {total === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-foreground/40">در این بازه رویدادی ثبت نشده است.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--foreground) / 0.08)" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} interval={range === "1y" || range === "all" ? 0 : "preserveStartEnd"} />
            <YAxis allowDecimals={false} tick={axisTick} width={28} tickFormatter={formatNumber} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ stroke: "rgb(var(--foreground) / 0.15)" }}
              formatter={(value, name) => [toPersianDigits(String(value ?? "")), name]}
            />
            <Legend
              content={(p) => (
                <ChartLegend payload={p.payload} hidden={hidden} onToggle={(key) => toggleCategory(key as LogCategory)} />
              )}
            />
            {ALL_LOG_CATEGORIES.map((category) => (
              <Line
                key={category}
                dataKey={category}
                name={CATEGORY_LABELS_FA[category]}
                stroke={CATEGORY_META[category].hex}
                strokeWidth={2}
                dot={false}
                hide={hidden.has(category)}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// Includes the Jalali date, not just HH:mm — score history can span many
// days (60-entry cap, 1-run-per-minute throttle), and two runs on different
// days at the same time of day would otherwise render identical X-axis labels.
function formatRunLabel(iso: string): string {
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return toPersianDigits(`${jalaliDayLabel(d)} ${time}`);
}

type StrategyFilter = LighthouseStrategy | "both";

// Same validated categorical pair used for StorageTrendChart's two series
// (public/private uploads) — reused here for mobile/desktop rather than
// re-running the palette validator for what's the same "two fixed-identity
// series" job (node scripts/validate_palette.js "#3987e5,#d95926" already
// passed: lightness band, CVD ΔE 26.8, normal-vision ΔE 31.8, contrast).
const MOBILE_COLOR = "#3987e5";
const DESKTOP_COLOR = "#d95926";

function StrategyFilterSelect({ value, onChange }: { value: StrategyFilter; onChange: (v: StrategyFilter) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as StrategyFilter)}
      aria-label="فیلتر استراتژی تست سرعت"
      className="min-h-11 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-xs font-medium text-foreground/70 outline-none transition-colors focus:border-accent-500/50"
    >
      <option value="both" className="bg-background">
        هر دو
      </option>
      <option value="mobile" className="bg-background">
        موبایل
      </option>
      <option value="desktop" className="bg-background">
        دسکتاپ
      </option>
    </select>
  );
}

type ScoreDotPayload = { mobileScore?: number; desktopScore?: number };

// Dot fill still encodes score tier (good/warning/critical) — a secondary
// encoding layered on top of the line's own stroke color, which already
// carries series identity (mobile vs desktop) via MOBILE_COLOR/DESKTOP_COLOR
// and the legend, so this never has to double as identity by itself.
function scoreDot(scoreKey: keyof ScoreDotPayload) {
  function ScoreDot(props: { cx?: number; cy?: number; payload?: ScoreDotPayload; key?: React.Key | null }) {
    const { cx, cy, payload, key } = props;
    const value = payload?.[scoreKey];
    if (cx == null || cy == null || value == null) return <g key={key} />;
    return <circle key={key} cx={cx} cy={cy} r={4} fill={scoreTierHex(value)} stroke="none" />;
  }
  return ScoreDot;
}

export function LighthouseTrendChart({ history }: { history: LighthouseRun[] }) {
  const [filter, setFilter] = useState<StrategyFilter>("both");
  const filtered = filter === "both" ? history : history.filter((r) => r.strategy === filter);

  if (filtered.length < 2) {
    return (
      <ChartCard title="روند امتیاز سرعت" height={56} action={<StrategyFilterSelect value={filter} onChange={setFilter} />}>
        <div className="flex h-full items-center justify-center text-center text-sm text-foreground/40">
          برای نمایش روند، حداقل به دو بار اجرای تست سرعت (با همین فیلتر) نیاز است.
        </div>
      </ChartCard>
    );
  }

  const sorted = [...filtered].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const data = sorted.map((run) => ({
    label: formatRunLabel(run.timestamp),
    mobileScore: run.strategy === "mobile" ? run.performanceScore : undefined,
    desktopScore: run.strategy === "desktop" ? run.performanceScore : undefined,
  }));

  const showMobile = filter !== "desktop";
  const showDesktop = filter !== "mobile";

  return (
    <ChartCard title="روند امتیاز سرعت" height={56} action={<StrategyFilterSelect value={filter} onChange={setFilter} />}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--foreground) / 0.08)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={axisTick} width={28} tickFormatter={formatNumber} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ stroke: "rgb(var(--foreground) / 0.15)" }}
            formatter={(value, name) => [toPersianDigits(String(value ?? "")), name]}
          />
          {filter === "both" && <Legend content={(p) => <ChartLegend payload={p.payload} />} />}
          {showMobile && (
            <Line
              type="monotone"
              dataKey="mobileScore"
              name="موبایل"
              stroke={MOBILE_COLOR}
              strokeWidth={2}
              connectNulls
              dot={scoreDot("mobileScore")}
              activeDot={{ r: 5 }}
            />
          )}
          {showDesktop && (
            <Line
              type="monotone"
              dataKey="desktopScore"
              name="دسکتاپ"
              stroke={DESKTOP_COLOR}
              strokeWidth={2}
              connectNulls
              dot={scoreDot("desktopScore")}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
