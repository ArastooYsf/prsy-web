"use client";

import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber, toPersianDigits } from "@/lib/format-number";
import { scoreTierHex } from "@/lib/score-tier";
import { axisTick, ChartCard, RangeFilter, tooltipLabelStyle, tooltipStyle } from "@/components/admin/DashboardCharts";
import { CATEGORY_META } from "@/components/admin/log-category-meta";
import { jalaliDayLabel, type StatsRange } from "@/lib/stats-range";
import { ALL_LOG_CATEGORIES, CATEGORY_LABELS_FA, type LogCategory } from "@/lib/log-types";
import type { CategoryTrendPoint } from "@/lib/log-stats";
import type { LighthouseRun } from "@/lib/lighthouse";

// One line per log category, all sharing an axis — replaces what used to be
// two separate single-series 30-day-only charts (crash, warning). A time
// range filter (same RangeFilter used elsewhere in the admin dashboard) and
// a click-to-toggle legend (standard recharts pattern) let an admin isolate
// one category or compare all of them. Line colors come straight from
// CATEGORY_META (log-category-meta.tsx) — the same source the file-list
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
              wrapperStyle={{ fontSize: 12, direction: "rtl", cursor: "pointer" }}
              onClick={(o) => toggleCategory(o.dataKey as LogCategory)}
              formatter={(value, entry) => (
                <span style={{ color: hidden.has(entry.dataKey as LogCategory) ? "rgb(var(--foreground) / 0.35)" : undefined }}>{value}</span>
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

export function LighthouseTrendChart({ history }: { history: LighthouseRun[] }) {
  if (history.length < 2) {
    return (
      <ChartCard title="روند امتیاز سرعت" height={56}>
        <div className="flex h-full items-center justify-center text-center text-sm text-foreground/40">
          برای نمایش روند، حداقل به دو بار اجرای تست سرعت نیاز است.
        </div>
      </ChartCard>
    );
  }

  const data = history.map((run) => ({ label: formatRunLabel(run.timestamp), score: run.performanceScore }));

  return (
    <ChartCard title="روند امتیاز سرعت" height={56}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--foreground) / 0.08)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={axisTick} width={28} tickFormatter={formatNumber} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ stroke: "rgb(var(--foreground) / 0.15)" }}
            formatter={(value) => [toPersianDigits(String(value ?? "")), "امتیاز Performance"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={(props: { cx?: number; cy?: number; payload?: { score: number }; key?: React.Key | null }) => {
              const { cx, cy, payload, key } = props;
              if (cx == null || cy == null || !payload) return <g key={key} />;
              return <circle key={key} cx={cx} cy={cy} r={4} fill={scoreTierHex(payload.score)} stroke="none" />;
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
