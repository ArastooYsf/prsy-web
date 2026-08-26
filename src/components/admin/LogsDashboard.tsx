"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Gauge, Search, ShieldAlert, type LucideIcon } from "lucide-react";
import { formatNumber, toPersianDigits } from "@/lib/format-number";
import { formatJalaliDateTime } from "@/lib/jalali";
import { scoreGradientColor } from "@/lib/score-tier";
import { useToast } from "@/components/ToastProvider";
import { LighthouseTrendChart, LogEventsTrendChart } from "@/components/admin/LogsDashboardChartsLazy";
import type { UptimeStats, DailyUptimeSegment } from "@/lib/uptime";
import type { CategoryEventStats, CategoryTrendPoint } from "@/lib/log-stats";
import type { LighthouseRun } from "@/lib/lighthouse";

type LogsDashboardProps = {
  uptime: UptimeStats;
  uptimeSegments: DailyUptimeSegment[];
  uptimeSummaryPercent: number | null;
  crashStats: CategoryEventStats;
  warningStats: CategoryEventStats;
  lighthouseHistory: LighthouseRun[];
  initialTrend: CategoryTrendPoint[];
};

function formatDurationFa(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${formatNumber(days)} روز`);
  if (hours > 0) parts.push(`${formatNumber(hours)} ساعت`);
  if (days === 0 && minutes > 0) parts.push(`${formatNumber(minutes)} دقیقه`);

  return parts.length > 0 ? parts.join(" و ") : "کمتر از یک دقیقه";
}

function formatUptimePercent(percent: number | null): string {
  return percent === null ? "در حال جمع‌آوری داده" : toPersianDigits(`${percent.toFixed(1)}٪`);
}

// Crash and warning are the same card shape (icon + label + big number +
// today/7d/30d caption), only the icon/colors/label/stats differ — one
// component instead of two copy-pasted blocks.
function CategoryStatCard({
  icon: Icon,
  colorClass,
  borderClass,
  bgClass,
  label,
  stats,
}: {
  icon: LucideIcon;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  label: string;
  stats: CategoryEventStats;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${borderClass} ${bgClass}`}>
      <div className={`flex items-center gap-2 ${colorClass}`}>
        <Icon className="size-4" />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{formatNumber(stats.today)}</p>
      <p className="mt-1 text-xs text-foreground/40">
        امروز — {formatNumber(stats.last7Days)} در ۷ روز، {formatNumber(stats.last30Days)} در ۳۰ روز
      </p>
    </div>
  );
}

const SEGMENT_STATUS_CLASS: Record<DailyUptimeSegment["status"], string> = {
  up: "bg-emerald-500",
  partial: "bg-amber-500",
  down: "bg-red-500",
  unknown: "bg-foreground/10",
};

function segmentTooltipText(s: DailyUptimeSegment): string {
  return s.percent === null ? `${s.label} — بدون داده` : `${s.label} — ${toPersianDigits(s.percent.toFixed(1))}٪ آپ‌تایم`;
}

// Status-page-style (UptimeRobot/StatusPage) daily segment strip. The
// hover/focus detail renders as a fixed line below the strip rather than a
// floating bubble above each segment — the strip scrolls horizontally
// (`overflow-x-auto`), and per the CSS overflow spec a non-"visible" value
// on one axis forces the other axis to "auto" too, which would clip any
// absolutely-positioned tooltip that pokes outside the row's own height.
function UptimeSegmentStrip({ segments }: { segments: DailyUptimeSegment[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const detail = hovered !== null ? segments[hovered] : null;

  return (
    <div>
      <div dir="ltr" className="flex gap-[2px] overflow-x-auto pb-1">
        {segments.map((s, i) => (
          <div
            key={s.dateKey}
            tabIndex={0}
            role="img"
            aria-label={segmentTooltipText(s)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered((h) => (h === i ? null : h))}
            className={`h-8 w-2 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 ${SEGMENT_STATUS_CLASS[s.status]}`}
          />
        ))}
      </div>
      <p className="mt-1.5 h-4 text-xs text-foreground/60">{detail ? segmentTooltipText(detail) : ""}</p>
    </div>
  );
}

function UptimeCard({
  uptime,
  segments,
  summaryPercent,
}: {
  uptime: UptimeStats;
  segments: DailyUptimeSegment[];
  summaryPercent: number | null;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <div className="flex items-center gap-2 text-foreground/60">
        <Activity className="size-4" />
        <p className="text-sm">آپ‌تایم</p>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-2xl font-bold">{formatDurationFa(uptime.currentUptimeMs)}</p>
        <p className="text-xs text-foreground/40">از {formatJalaliDateTime(new Date(uptime.startedAt))}</p>
      </div>

      <div className="mt-4 border-t border-foreground/10 pt-4">
        {segments.length === 0 ? (
          <p className="text-xs text-foreground/40">هنوز داده‌ی کافی برای نمایش روند آپ‌تایم ثبت نشده است.</p>
        ) : (
          <>
            <UptimeSegmentStrip segments={segments} />
            <p className="mt-2 text-sm font-semibold text-foreground/80">
              {formatUptimePercent(summaryPercent)} آپ‌تایم در {formatNumber(segments.length)} روز اخیر
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-foreground/50">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                سالم
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500" />
                قطعی جزئی
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500" />
                قطعی کامل
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-foreground/10" />
                بدون داده
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Simulated progress while the audit is running (Lighthouse's own CLI here
// gives no streamable progress signal), asymptotically approaching 92% so it
// never falsely claims completion before the real result lands. Jumps to the
// real score the instant the request resolves.
function SpeedTestCard({
  latest,
  running,
  progress,
  onRun,
}: {
  latest: LighthouseRun | null;
  running: boolean;
  progress: number;
  onRun: () => void;
}) {
  const barPercent = running ? progress : (latest?.performanceScore ?? 0);
  const barColor = running ? undefined : latest ? scoreGradientColor(latest.performanceScore) : undefined;

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <div className="flex items-center gap-2 text-foreground/60">
        <Gauge className="size-4" />
        <p className="text-sm">سرعت سایت</p>
      </div>

      <p className="mt-2 text-2xl font-bold" style={{ color: !running && latest ? barColor : undefined }}>
        {running ? "…" : latest ? formatNumber(latest.performanceScore) : "—"}
      </p>

      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-300 ease-out ${running ? "bg-accent-500" : ""}`}
          style={{ width: `${barPercent}%`, backgroundColor: running ? undefined : barColor }}
        />
      </div>

      <p className="mt-2 text-xs text-foreground/40">
        {running ? "در حال اجرای تست..." : latest ? `آخرین تست: ${formatJalaliDateTime(latest.timestamp)}` : "هنوز تستی اجرا نشده است"}
      </p>
      <p className="mt-1 text-[11px] text-foreground/35">۰–۴۹: نیاز به بهبود · ۵۰–۸۹: متوسط · ۹۰–۱۰۰: عالی</p>

      <button
        type="button"
        onClick={onRun}
        disabled={running}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-3.5 text-xs font-medium text-accent-400 transition-colors hover:bg-accent-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? "در حال اجرا..." : "اجرای تست سرعت"}
      </button>
    </div>
  );
}

export default function LogsDashboard({
  uptime,
  uptimeSegments,
  uptimeSummaryPercent,
  crashStats,
  warningStats,
  lighthouseHistory,
  initialTrend,
}: LogsDashboardProps) {
  const { showToast } = useToast();
  const [history, setHistory] = useState(lighthouseHistory);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const latest = history[history.length - 1] ?? null;

  // If the admin navigates away mid-test, runSpeedTest's own `finally` never
  // runs (the async function is still suspended on the in-flight fetch) —
  // without this, the 200ms progress interval would keep ticking against an
  // unmounted component until the Lighthouse request itself resolves.
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const runSpeedTest = async () => {
    setRunning(true);
    setProgress(0);
    const startedAt = Date.now();
    progressTimer.current = setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      setProgress(92 * (1 - Math.exp(-elapsedSeconds / 8)));
    }, 200);

    try {
      const res = await fetch("/api/admin/logs/lighthouse", { method: "POST" });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        showToast(body?.error ?? "اجرای تست سرعت ناموفق بود.", "error");
        return;
      }

      setProgress(100);
      setHistory((prev) => [...prev, body.run as LighthouseRun]);
      showToast(`تست سرعت اجرا شد — امتیاز Performance: ${formatNumber(body.run.performanceScore)}`);
    } catch {
      showToast("اجرای تست سرعت ناموفق بود — اتصال برقرار نشد.", "error");
    } finally {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setRunning(false);
    }
  };

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-sm font-semibold text-foreground/70">خلاصه وضعیت سیستم</h3>

      <UptimeCard uptime={uptime} segments={uptimeSegments} summaryPercent={uptimeSummaryPercent} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CategoryStatCard
          icon={AlertTriangle}
          colorClass="text-red-400/80"
          borderClass="border-red-500/20"
          bgClass="bg-red-500/[0.04]"
          label="کرش"
          stats={crashStats}
        />

        <CategoryStatCard
          icon={ShieldAlert}
          colorClass="text-amber-400/80"
          borderClass="border-amber-500/20"
          bgClass="bg-amber-500/[0.04]"
          label="هشدار (مهم و امنیتی)"
          stats={warningStats}
        />

        <SpeedTestCard latest={latest} running={running} progress={progress} onRun={runSpeedTest} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LogEventsTrendChart initialData={initialTrend} initialRange="30d" />
        </div>
        <LighthouseTrendChart history={history} />
      </div>

      <div className="rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] p-5">
        <div className="flex items-center gap-2 text-foreground/50">
          <Search className="size-4" />
          <p className="text-sm font-semibold">سئو و بک‌لینک</p>
        </div>
        <p className="mt-1.5 text-xs text-foreground/40">
          نیاز به اتصال به Google Search Console و PageSpeed API — بعد از آنلاین شدن سایت تنظیم می‌شود.
        </p>
      </div>
    </div>
  );
}
