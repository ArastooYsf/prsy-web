import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatPercent } from "@/lib/format-number";

// Default thresholds — right for "% of the whole shared disk" (logs bar):
// even 10% of a whole server volume is worth a look. A fixed dedicated quota
// (a 5GB upload volume) needs much higher thresholds since being, say, 15%
// full there is completely normal — callers pass their own via props.
const DEFAULT_WARN_THRESHOLD = 10;
const DEFAULT_DANGER_THRESHOLD = 25;

export type StorageTone = "ok" | "warn" | "danger" | "unknown";

export function toneForPercent(
  percent: number,
  warnThreshold = DEFAULT_WARN_THRESHOLD,
  dangerThreshold = DEFAULT_DANGER_THRESHOLD,
): StorageTone {
  return percent >= dangerThreshold ? "danger" : percent >= warnThreshold ? "warn" : "ok";
}

const TONE_BAR: Record<StorageTone, string> = {
  ok: "bg-accent-500",
  warn: "bg-amber-500",
  danger: "bg-red-500",
  unknown: "bg-foreground/15",
};
const TONE_TEXT: Record<StorageTone, string> = {
  ok: "text-foreground/70",
  warn: "text-amber-400",
  danger: "text-red-400",
  unknown: "text-foreground/40",
};

type StorageBarProps = {
  icon: LucideIcon;
  label: string;
  /** null = unknown/not connected — renders an empty track and no percentage, instead of a fake 0%. */
  percent: number | null;
  description: ReactNode;
  warnThreshold?: number;
  dangerThreshold?: number;
  /** Shown as a visible banner (not just a color change) once tone reaches "danger" — e.g. "نزدیک به سقف ظرفیت". Color alone never carries this warning. */
  warningLabel?: string;
};

/**
 * Shared shell for every storage-usage bar in the admin panel (site-wide
 * upload volumes, download host, logs) — one place for the bar's look and
 * "not connected" state instead of near-identical copies.
 */
export default function StorageBar({
  icon: Icon,
  label,
  percent,
  description,
  warnThreshold,
  dangerThreshold,
  warningLabel,
}: StorageBarProps) {
  const tone: StorageTone = percent === null ? "unknown" : toneForPercent(percent, warnThreshold, dangerThreshold);

  return (
    <div className="mb-4 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <Icon className="size-4 text-foreground/50" />
          {label}
        </div>
        {percent !== null && <span className={`text-sm font-bold ${TONE_TEXT[tone]}`}>{formatPercent(percent)}</span>}
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10"
        role="progressbar"
        aria-valuenow={percent === null ? undefined : Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {percent !== null && (
          <div
            className={`h-full rounded-full transition-all ${TONE_BAR[tone]}`}
            style={{ width: `${Math.max(percent, percent > 0 ? 1 : 0)}%` }}
          />
        )}
      </div>

      <div className="mt-2 text-xs text-foreground/50">{description}</div>

      {tone === "danger" && warningLabel && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          {warningLabel}
        </div>
      )}
    </div>
  );
}
