import { AlertTriangle, Bell, Flag, KeyRound, ShieldAlert } from "lucide-react";
import { CATEGORY_LABELS_FA, type LogCategory } from "@/lib/log-types";

export type LogCategoryMeta = {
  label: string;
  /** Badge classes (border/bg/text) — used as-is for chips. */
  badgeClassName: string;
  /** Subtle full-row/table tint for scanability — see LogsExplorer/LogFileDetail. */
  tintClassName: string;
  icon: typeof AlertTriangle | null;
  /** Raw hex of the same color as badgeClassName/tintClassName — for
   *  contexts (recharts `stroke`, canvas, inline styles) that can't consume
   *  a Tailwind class. Keeps the log-events trend chart's line colors
   *  identical to these badges instead of a second, separately-maintained map. */
  hex: string;
};

// Single source of truth for how each category reads visually, shared by
// the file list (LogsExplorer), the file detail table (LogFileDetail), and
// the log-events trend chart (LogsDashboardCharts.tsx) so none of them ever
// drift out of sync on colors/icons.
export const CATEGORY_META: Record<LogCategory, LogCategoryMeta> = {
  general: {
    label: CATEGORY_LABELS_FA.general,
    badgeClassName: "border-foreground/10 bg-foreground/5 text-foreground/60",
    tintClassName: "",
    icon: null,
    hex: "#71717a", // zinc-500
  },
  important: {
    label: CATEGORY_LABELS_FA.important,
    badgeClassName: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    tintClassName: "bg-violet-500/[0.03]",
    icon: Flag,
    hex: "#8b5cf6", // violet-500
  },
  access: {
    label: CATEGORY_LABELS_FA.access,
    badgeClassName: "border-teal-500/30 bg-teal-500/10 text-teal-400",
    tintClassName: "bg-teal-500/[0.03]",
    icon: KeyRound,
    hex: "#14b8a6", // teal-500
  },
  notification: {
    label: CATEGORY_LABELS_FA.notification,
    badgeClassName: "border-brand-400/30 bg-brand-400/10 text-brand-300",
    tintClassName: "bg-brand-400/[0.03]",
    icon: Bell,
    hex: "#60a5fa", // brand-400
  },
  security: {
    label: CATEGORY_LABELS_FA.security,
    badgeClassName: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    tintClassName: "bg-amber-500/[0.04]",
    icon: ShieldAlert,
    hex: "#f59e0b", // amber-500
  },
  crash: {
    label: CATEGORY_LABELS_FA.crash,
    badgeClassName: "border-red-500/30 bg-red-500/10 text-red-400",
    tintClassName: "bg-red-500/[0.04]",
    icon: AlertTriangle,
    hex: "#ef4444", // red-500
  },
};

export function CategoryBadge({ category }: { category: LogCategory }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClassName}`}>
      {Icon && <Icon className="size-3" />}
      {meta.label}
    </span>
  );
}
