import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { History } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { listLogFiles } from "@/lib/logger";
import { getLogEventTrend, summarizeCategoryTrend } from "@/lib/log-stats";
import { getUptimeStats, getUptimeSegments } from "@/lib/uptime";
import { getLighthouseHistory } from "@/lib/lighthouse";
import { ALL_LOG_CATEGORIES } from "@/lib/log-types";
import LogsExplorer from "@/components/admin/LogsExplorer";
import LogsDashboard from "@/components/admin/LogsDashboard";

export const metadata: Metadata = {
  title: "گزارش رویدادها",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  // Only the stats/trend calls actually need `files` — kick that off
  // alongside the independent reads (uptime, uptime segments, lighthouse
  // history) instead of serializing everything behind it.
  const [files, uptime, uptimeSegmentsResult, lighthouseHistory] = await Promise.all([
    listLogFiles(),
    getUptimeStats(),
    getUptimeSegments(),
    getLighthouseHistory(),
  ]);
  // One read+bucket pass across every category (getLogEventTrend), not
  // three overlapping ones — crash/important/security files would otherwise
  // get read a second and third time by their own dedicated stats calls.
  // The stat cards' today/7d/30d numbers are then a pure, I/O-free
  // aggregation over that same 30-day trend.
  const initialTrend = await getLogEventTrend(files, "30d", ALL_LOG_CATEGORIES);
  const crashStats = summarizeCategoryTrend(initialTrend, ["crash"]);
  const warningStats = summarizeCategoryTrend(initialTrend, ["important", "security"]);

  return (
    <div className="pb-12">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
        <History className="size-5 text-accent-400" />
        گزارش رویدادها
      </h2>
      <p className="mb-6 text-sm text-foreground/50">
        رویدادهای عمومی، مهم، دسترسی و اعلان هرکدام در یک فایل روزانه جداگانه (بر اساس تاریخ شمسی) ثبت می‌شوند. فایل‌های
        امنیتی و کرش زمان‌بندی روزانه ندارند — فقط وقتی رویدادی واقعاً رخ بدهد ساخته می‌شوند، از همان لحظه قفل هستند و
        هیچ فایل قفل‌شده‌ای — نه دستی و نه خودکار — حذف نمی‌شود. برای مشاهده‌ی جزئیات رویدادهای هر فایل، روی آن کلیک کنید.
      </p>

      <LogsDashboard
        uptime={uptime}
        uptimeSegments={uptimeSegmentsResult.segments}
        uptimeSummaryPercent={uptimeSegmentsResult.summaryPercent}
        crashStats={crashStats}
        warningStats={warningStats}
        lighthouseHistory={lighthouseHistory}
        initialTrend={initialTrend}
      />

      {files.length === 0 ? (
        <p className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6 text-center text-sm text-foreground/50">
          هنوز هیچ رویدادی ثبت نشده است.
        </p>
      ) : (
        <LogsExplorer files={files} />
      )}
    </div>
  );
}
