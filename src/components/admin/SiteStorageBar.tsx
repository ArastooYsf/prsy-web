import { Database, HardDrive } from "lucide-react";
import { formatBytesLarge } from "@/lib/format-number";
import type { StorageUsageReport, StorageVolumeUsage, StorageTrendPoint } from "@/lib/storage-usage";
import StorageBar from "@/components/admin/StorageBar";
import { StorageTrendChart } from "@/components/admin/StorageTrendChartLazy";

// "بالای ۸۰٪" per spec — one threshold, not a two-tier warn/danger ramp:
// this bar is green up to 80%, then red with an explicit warning banner.
const CAP_THRESHOLD = 80;

function VolumeCard({ icon, volume }: { icon: typeof HardDrive; volume: StorageVolumeUsage }) {
  const percent = volume.capBytes > 0 ? Math.min(100, (volume.usedBytes / volume.capBytes) * 100) : 0;
  const sortedBreakdown = [...volume.breakdown].filter((b) => b.bytes > 0).sort((a, b) => b.bytes - a.bytes);

  return (
    <StorageBar
      icon={icon}
      label={volume.label}
      percent={percent}
      warnThreshold={CAP_THRESHOLD}
      dangerThreshold={CAP_THRESHOLD}
      warningLabel={`نزدیک به سقف ${formatBytesLarge(volume.capBytes)} اختصاصی — ظرفیت این حجم رو به اتمام است.`}
      description={
        <>
          <p>
            {formatBytesLarge(volume.usedBytes)} از {formatBytesLarge(volume.capBytes)} اختصاصی — فضای واقعی
            استفاده‌شده روی دیسک، نه ظرفیت کل سرور.
          </p>
          {sortedBreakdown.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-foreground/10 pt-2">
              {sortedBreakdown.map((entry) => (
                <li key={entry.label} className="flex items-center justify-between gap-3">
                  <span className="truncate">{entry.label}</span>
                  <span dir="ltr" className="shrink-0 text-foreground/70">
                    {formatBytesLarge(entry.bytes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      }
    />
  );
}

export default function SiteStorageBar({ report, trend }: { report: StorageUsageReport; trend: StorageTrendPoint[] }) {
  return (
    <div className="mb-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground/70">
        <Database className="size-4" />
        فضای اختصاصی آپلود
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <VolumeCard icon={HardDrive} volume={report.public} />
        <VolumeCard icon={HardDrive} volume={report.private} />
      </div>
      <div className="mt-3">
        <StorageTrendChart data={trend} />
      </div>
    </div>
  );
}
