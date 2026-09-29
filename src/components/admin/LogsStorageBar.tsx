import { FileClock } from "lucide-react";
import { formatBytesLarge, formatPercent } from "@/lib/format-number";
import { LOG_DIR_SIZE_CAP_BYTES, type LogStorageUsage } from "@/lib/logger";
import StorageBar, { toneForPercent } from "@/components/admin/StorageBar";

export default function LogsStorageBar({ usage }: { usage: LogStorageUsage }) {
  const usingDiskMetric = usage.percentOfDisk !== null;
  const percent = usingDiskMetric ? usage.percentOfDisk! : usage.percentOfLogCap;

  return (
    <StorageBar
      icon={FileClock}
      label="فضای اشغال‌شده توسط لاگ‌ها"
      percent={percent}
      description={
        usingDiskMetric ? (
          <>
            {formatBytesLarge(usage.logDirBytes)} از {formatBytesLarge(usage.diskTotalBytes!)} فضای کل سایت — یعنی{" "}
            {formatPercent(percent)}
            {toneForPercent(percent) !== "ok" && " — این مقدار قابل توجه است."}
          </>
        ) : (
          <>
            {formatBytesLarge(usage.logDirBytes)} از سقف {formatBytesLarge(LOG_DIR_SIZE_CAP_BYTES)} تنظیم‌شده برای
            لاگ‌ها (اندازه‌ی کل دیسک در این محیط قابل خواندن نبود، این عدد نسبت به همان سقف است، نه کل فضای سایت).
          </>
        )
      }
    />
  );
}
