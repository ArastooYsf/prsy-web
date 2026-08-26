import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, History, Lock } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getLogFileMeta, isValidLogFilename, readLogEntries } from "@/lib/logger";
import { toPersianDigits, formatNumber } from "@/lib/format-number";
import { CategoryBadge } from "@/components/admin/log-category-meta";
import LogFileDetail from "@/components/admin/LogFileDetail";

export const metadata: Metadata = {
  title: "جزئیات فایل لاگ",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatSize(bytes: number) {
  if (bytes < 1024) return toPersianDigits(`${bytes} بایت`);
  if (bytes < 1024 * 1024) return toPersianDigits(`${Math.round(bytes / 1024)} کیلوبایت`);
  return toPersianDigits(`${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`);
}

export default async function AdminLogFileDetailPage({ params }: { params: { filename: string } }) {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const filename = decodeURIComponent(params.filename);
  if (!isValidLogFilename(filename)) {
    notFound();
  }

  const meta = await getLogFileMeta(filename);
  if (!meta) {
    notFound();
  }

  // enforceRetention() (triggered by any concurrent logEvent() write) can
  // delete an unlocked file in the gap between getLogFileMeta() succeeding
  // above and this read — treat a vanished file as zero entries rather than
  // crashing this Server Component with an uncaught ENOENT.
  const entries = await readLogEntries(filename).catch(() => []);

  return (
    <div>
      <Link
        href="/account/admin/logs"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground/60 transition-colors hover:text-accent-400"
      >
        <ArrowRight className="size-4" />
        بازگشت به گزارش رویدادها
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <History className="size-5 text-accent-400" />
          <span dir="ltr" className="font-mono text-base">
            {filename}
          </span>
        </h2>
        <CategoryBadge category={meta.category} />
        {meta.locked && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
            <Lock className="size-3" />
            قفل‌شده
          </span>
        )}
        <span className="text-xs text-foreground/40">{formatSize(meta.size)}</span>
        <span className="text-xs text-foreground/40">{formatNumber(entries.length)} رویداد</span>
      </div>

      <LogFileDetail category={meta.category} entries={entries} />
    </div>
  );
}

