"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Gauge, Search, ShieldAlert, type LucideIcon } from "lucide-react";
import { formatNumber, toPersianDigits } from "@/lib/format-number";
import { formatJalaliDateTime } from "@/lib/jalali";
import { scoreGradientColor, vitalTierTextClass, type VitalKey } from "@/lib/score-tier";
import { useToast } from "@/components/ToastProvider";
import { LighthouseTrendChart, LogEventsTrendChart } from "@/components/admin/LogsDashboardChartsLazy";
import type { UptimeStats, DailyUptimeSegment } from "@/lib/uptime";
import type { CategoryEventStats, CategoryTrendPoint } from "@/lib/log-stats";
import type { LighthouseOpportunity, LighthouseRun } from "@/lib/lighthouse";
import { STRATEGY_LABELS_FA, type LighthouseStrategy } from "@/lib/lighthouse-strategy";

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

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = scoreGradientColor(score);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-foreground/60">
        <span>{label}</span>
        <span className="font-semibold" style={{ color }}>
          {formatNumber(score)}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Core Web Vitals: real measured values, colored by web.dev's official
// per-metric thresholds (vitalTierTextClass) — a separate scale from the
// 0-100 category scores above (see score-tier.ts).
const VITAL_META: Record<VitalKey, { label: string; format: (v: number) => string }> = {
  lcp: { label: "LCP", format: (v) => `${toPersianDigits(v.toFixed(1))} ثانیه` },
  fcp: { label: "FCP", format: (v) => `${toPersianDigits(v.toFixed(1))} ثانیه` },
  cls: { label: "CLS", format: (v) => toPersianDigits(v.toFixed(3)) },
  tbt: { label: "TBT", format: (v) => `${formatNumber(Math.round(v))} میلی‌ثانیه` },
};

function VitalChip({ vitalKey, value }: { vitalKey: VitalKey; value: number | null }) {
  if (value === null) return null;
  const meta = VITAL_META[vitalKey];
  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-2 py-2 text-center">
      <p className="text-[10px] text-foreground/40">{meta.label}</p>
      <p className={`text-sm font-bold ${vitalTierTextClass(vitalKey, value)}`}>{meta.format(value)}</p>
    </div>
  );
}

function OpportunityList({ opportunities }: { opportunities: LighthouseOpportunity[] }) {
  if (opportunities.length === 0) return null;
  return (
    <div className="mt-4 border-t border-foreground/10 pt-3">
      <p className="mb-2 text-xs font-semibold text-foreground/50">پیشنهادهای بهبود (به ترتیب بیشترین صرفه‌جویی زمانی)</p>
      <ul className="space-y-2.5">
        {opportunities.map((op) => (
          <li key={op.id} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground/80">{op.title}</span>
              {op.savingsMs !== null && (
                <span dir="ltr" className="shrink-0 text-foreground/40">
                  ~{formatNumber(Math.round(op.savingsMs))}ms
                </span>
              )}
            </div>
            {op.description && (
              <p dir="ltr" className="mt-0.5 text-left text-[11px] leading-relaxed text-foreground/40">
                {op.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// One card per strategy (mobile/desktop) — shows the 4 category scores, the
// 4 raw Core Web Vitals, and the opportunity list for that strategy's most
// recent run. `running` only dims/labels the card; it doesn't animate a fake
// progress fill per-card anymore (see SpeedTestPanel's single overall bar) —
// with up to 4 score bars + 4 vitals per card, per-card fake progress on
// everything would be more visual noise than signal.
function StrategyResultCard({ strategyLabel, run, running }: { strategyLabel: string; run: LighthouseRun | null; running: boolean }) {
  return (
    <div className={`rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 ${running ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground/70">{strategyLabel}</p>
        <p className="text-[11px] text-foreground/40">
          {running ? "در حال اجرا..." : run ? formatJalaliDateTime(run.timestamp) : "هنوز تستی اجرا نشده است"}
        </p>
      </div>

      {!run && (
        <p className="mt-6 text-center text-xs text-foreground/35">برای مشاهده‌ی نتایج، تست را اجرا کنید.</p>
      )}

      {run && (
        <>
          <div className="mt-4 space-y-3">
            {run.scores ? (
              <>
                <ScoreBar label="عملکرد" score={run.scores.performance} />
                <ScoreBar label="دسترس‌پذیری" score={run.scores.accessibility} />
                <ScoreBar label="بهترین شیوه‌ها" score={run.scores.bestPractices} />
                <ScoreBar label="سئو" score={run.scores.seo} />
              </>
            ) : (
              <ScoreBar label="عملکرد" score={run.performanceScore} />
            )}
          </div>
          <p className="mt-2 text-[11px] text-foreground/35">۰–۴۹: نیاز به بهبود · ۵۰–۸۹: متوسط · ۹۰–۱۰۰: عالی</p>

          {run.vitals && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              <VitalChip vitalKey="lcp" value={run.vitals.lcp} />
              <VitalChip vitalKey="cls" value={run.vitals.cls} />
              <VitalChip vitalKey="tbt" value={run.vitals.tbt} />
              <VitalChip vitalKey="fcp" value={run.vitals.fcp} />
            </div>
          )}

          {run.opportunities && <OpportunityList opportunities={run.opportunities} />}
        </>
      )}
    </div>
  );
}

type StrategySelection = LighthouseStrategy | "both";

function StrategyTabs({
  value,
  onChange,
  disabled,
}: {
  value: StrategySelection;
  onChange: (v: StrategySelection) => void;
  disabled?: boolean;
}) {
  const options: { value: StrategySelection; label: string }[] = [
    { value: "mobile", label: "موبایل" },
    { value: "desktop", label: "دسکتاپ" },
    { value: "both", label: "هر دو" },
  ];
  return (
    <div role="tablist" aria-label="استراتژی تست سرعت" className="inline-flex rounded-lg border border-foreground/10 bg-foreground/5 p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`min-h-9 rounded-md px-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            value === opt.value ? "bg-accent-500 text-white" : "text-foreground/60 hover:text-foreground/80"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Simulated progress while the audit is running (Lighthouse's own CLI/the
// PageSpeed API here give no streamable progress signal), asymptotically
// approaching 92% so it never falsely claims completion before the real
// result lands — scaled to roughly double the expected wait when running
// both strategies back-to-back.
function SpeedTestPanel({ history, onHistoryChange }: { history: LighthouseRun[]; onHistoryChange: (next: LighthouseRun[]) => void }) {
  const { showToast } = useToast();
  const [selection, setSelection] = useState<StrategySelection>("desktop");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const latestByStrategy: Partial<Record<LighthouseStrategy, LighthouseRun>> = {};
  for (const run of history) {
    latestByStrategy[run.strategy] = run; // history is chronological — the last write per strategy wins
  }

  // If the admin navigates away mid-test, runSpeedTest's own `finally` never
  // runs (the async function is still suspended on the in-flight fetch) —
  // without this, the 200ms progress interval would keep ticking against an
  // unmounted component until the request itself resolves.
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const runSpeedTest = async () => {
    setRunning(true);
    setProgress(0);
    const startedAt = Date.now();
    const expectedSeconds = selection === "both" ? 16 : 8;
    progressTimer.current = setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      setProgress(92 * (1 - Math.exp(-elapsedSeconds / expectedSeconds)));
    }, 200);

    try {
      const res = await fetch("/api/admin/logs/lighthouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: selection }),
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        showToast(body?.error ?? "اجرای تست سرعت ناموفق بود.", "error");
        return;
      }

      const runs = (body?.runs ?? []) as LighthouseRun[];
      setProgress(100);
      onHistoryChange([...history, ...runs]);

      const errors = (body?.errors ?? []) as { strategy: LighthouseStrategy; error: string }[];
      for (const err of errors) {
        showToast(`${STRATEGY_LABELS_FA[err.strategy]}: ${err.error}`, "error");
      }
      if (runs.length > 0) {
        showToast(`تست سرعت اجرا شد — ${runs.map((r) => `${STRATEGY_LABELS_FA[r.strategy]}: ${formatNumber(r.performanceScore)}`).join("، ")}`);
      }
    } catch {
      showToast("اجرای تست سرعت ناموفق بود — اتصال برقرار نشد.", "error");
    } finally {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setRunning(false);
    }
  };

  const activeStrategies: LighthouseStrategy[] = selection === "both" ? ["mobile", "desktop"] : [selection];

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground/60">
          <Gauge className="size-4" />
          <p className="text-sm font-semibold">تست سرعت سایت</p>
        </div>
        <StrategyTabs value={selection} onChange={setSelection} disabled={running} />
      </div>

      {running && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-accent-500 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className={`mt-4 grid grid-cols-1 gap-4 ${activeStrategies.length === 2 ? "lg:grid-cols-2" : ""}`}>
        {activeStrategies.map((s) => (
          <StrategyResultCard key={s} strategyLabel={STRATEGY_LABELS_FA[s]} run={latestByStrategy[s] ?? null} running={running} />
        ))}
      </div>

      <button
        type="button"
        onClick={runSpeedTest}
        disabled={running}
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-3.5 text-xs font-medium text-accent-400 transition-colors hover:bg-accent-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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
  const [history, setHistory] = useState(lighthouseHistory);

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-sm font-semibold text-foreground/70">خلاصه وضعیت سیستم</h3>

      <UptimeCard uptime={uptime} segments={uptimeSegments} summaryPercent={uptimeSummaryPercent} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      <SpeedTestPanel history={history} onHistoryChange={setHistory} />

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
        <p className="mt-1.5 text-xs text-foreground/40">نیاز به اتصال به Google Search Console — بعد از آنلاین شدن سایت تنظیم می‌شود.</p>
      </div>
    </div>
  );
}
