import { Cloud, CloudOff } from "lucide-react";
import { formatBytesLarge } from "@/lib/format-number";
import type { DownloadHostStorageStatus } from "@/lib/download-host";
import StorageBar from "@/components/admin/StorageBar";

export default function DownloadHostStorageBar({ status }: { status: DownloadHostStorageStatus }) {
  if (!status.connected) {
    return (
      <StorageBar
        icon={CloudOff}
        label="فضای هاست دانلود"
        percent={null}
        description={
          status.configuredDomain
            ? `متصل نیست — دامنه‌ی «${status.configuredDomain}» فقط برای اعتبارسنجی لینک‌های دستی پیکربندی شده؛ این پنل هنوز راهی برای بررسی فضای آن هاست ندارد.`
            : "متصل نیست — هیچ هاست دانلودی پیکربندی نشده است."
        }
      />
    );
  }

  const percent = Math.min(100, (status.usedBytes / status.totalBytes) * 100);

  return (
    <StorageBar
      icon={Cloud}
      label="فضای هاست دانلود"
      percent={percent}
      description={`${formatBytesLarge(status.usedBytes)} از ${formatBytesLarge(status.totalBytes)}`}
    />
  );
}
