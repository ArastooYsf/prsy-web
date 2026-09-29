import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { formatPercent } from "@/lib/format-number";

// Anything above these is a real "this is eating the disk" concern, not just
// informational — shared by every storage bar (site-wide, logs, ...) so they
// all agree on what counts as "worth flagging".
const WARN_THRESHOLD = 10;
const DANGER_THRESHOLD = 25;

export type StorageTone = "ok" | "warn" | "danger" | "unknown";

export function toneForPercent(percent: number): StorageTone {
  return percent >= DANGER_THRESHOLD ? "danger" : percent >= WARN_THRESHOLD ? "warn" : "ok";
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
};

/**
 * Shared shell for every storage-usage bar in the admin panel (site-wide,
 * download host, logs) — one place for the bar's look, thresholds, and
 * "not connected" state instead of three near-identical copies.
 */
export default function StorageBar({ icon: Icon, label, percent, description }: StorageBarProps) {
  const tone: StorageTone = percent === null ? "unknown" : toneForPercent(percent);

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

      <p className="mt-2 text-xs text-foreground/50">{description}</p>
    </div>
  );
}
