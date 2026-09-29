import { HardDrive } from "lucide-react";
import { formatBytesLarge } from "@/lib/format-number";
import type { LogStorageUsage } from "@/lib/logger";
import StorageBar from "@/components/admin/StorageBar";

// Reuses the same statfs read LogsStorageBar already gets from
// getLogStorageUsage() — diskUsedBytes/diskTotalBytes are whole-volume
// numbers (uploads, backups, logs, everything on that disk), not just the
// log directory, so no second disk read is needed for this bar.
export default function SiteStorageBar({ usage }: { usage: LogStorageUsage }) {
  if (usage.diskTotalBytes === null || usage.diskUsedBytes === null || usage.diskTotalBytes <= 0) {
    return (
      <StorageBar
        icon={HardDrive}
        label="فضای اشغال‌شده‌ی کل سایت"
        percent={null}
        description="اندازه‌ی کل دیسک در این محیط قابل خواندن نبود (fs.statfs پشتیبانی نمی‌شود)."
      />
    );
  }

  const percent = Math.min(100, (usage.diskUsedBytes / usage.diskTotalBytes) * 100);

  return (
    <StorageBar
      icon={HardDrive}
      label="فضای اشغال‌شده‌ی کل سایت"
      percent={percent}
      description={
        <>
          {formatBytesLarge(usage.diskUsedBytes)} از {formatBytesLarge(usage.diskTotalBytes)} — شامل آپلودها،
          بک‌آپ‌ها، لاگ‌ها و هر چیز دیگری روی همین دیسک.
        </>
      }
    />
  );
}
