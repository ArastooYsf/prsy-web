import { HardDrive } from "lucide-react";
import { toPersianDigits } from "@/lib/format-number";
import { LOG_DIR_SIZE_CAP_BYTES, type LogStorageUsage } from "@/lib/logger";

// Local, not the shared formatFileSize (format-number.ts) — that one tops
// out at MB, which is right for a single log/upload file but not for a
// whole-disk total that's realistically in GB.
function formatBytes(bytes: number): string {
  if (bytes < 1024) return toPersianDigits(`${bytes} بایت`);
  if (bytes < 1024 ** 2) return toPersianDigits(`${(bytes / 1024).toFixed(1)} کیلوبایت`);
  if (bytes < 1024 ** 3) return toPersianDigits(`${(bytes / 1024 ** 2).toFixed(1)} مگابایت`);
  return toPersianDigits(`${(bytes / 1024 ** 3).toFixed(2)} گیگابایت`);
}

function formatPercent(value: number): string {
  const rounded = value < 1 && value > 0 ? value.toFixed(1) : Math.round(value).toString();
  return toPersianDigits(`${rounded}٪`);
}

// Anything above these is a real "logs are eating the disk" concern, not
// just informational — colors the bar/number accordingly instead of a flat
// neutral tone at every level.
const WARN_THRESHOLD = 10;
const DANGER_THRESHOLD = 25;

export default function LogsStorageBar({ usage }: { usage: LogStorageUsage }) {
  const usingDiskMetric = usage.percentOfDisk !== null;
  const percent = usingDiskMetric ? usage.percentOfDisk! : usage.percentOfLogCap;

  const tone = percent >= DANGER_THRESHOLD ? "danger" : percent >= WARN_THRESHOLD ? "warn" : "ok";
  const barColor = tone === "danger" ? "bg-red-500" : tone === "warn" ? "bg-amber-500" : "bg-accent-500";
  const textColor = tone === "danger" ? "text-red-400" : tone === "warn" ? "text-amber-400" : "text-foreground/70";

  return (
    <div className="mb-6 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <HardDrive className="size-4 text-foreground/50" />
          فضای اشغال‌شده توسط لاگ‌ها
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{formatPercent(percent)}</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(percent, percent > 0 ? 1 : 0)}%` }} />
      </div>

      <p className="mt-2 text-xs text-foreground/50">
        {usingDiskMetric ? (
          <>
            {formatBytes(usage.logDirBytes)} از {formatBytes(usage.diskTotalBytes!)} فضای کل سایت — یعنی {formatPercent(percent)}
            {tone !== "ok" && " — این مقدار قابل توجه است."}
          </>
        ) : (
          <>
            {formatBytes(usage.logDirBytes)} از سقف {formatBytes(LOG_DIR_SIZE_CAP_BYTES)} تنظیم‌شده برای لاگ‌ها (اندازه‌ی کل دیسک در این محیط قابل خواندن نبود، این عدد نسبت به همان سقف است، نه کل فضای سایت).
          </>
        )}
      </p>
    </div>
  );
}
