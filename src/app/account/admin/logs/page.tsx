import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { History } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { listLogFiles } from "@/lib/logger";
import LogsExplorer from "@/components/admin/LogsExplorer";

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

  const files = await listLogFiles();

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
        <History className="size-5 text-accent-400" />
        گزارش رویدادها
      </h2>
      <p className="mb-6 text-sm text-foreground/50">
        رویدادهای عمومی، مهم، دسترسی و اعلان هرکدام در یک فایل روزانه جداگانه (بر اساس تاریخ شمسی) ثبت می‌شوند. فایل‌های
        امنیتی و کرش زمان‌بندی روزانه ندارند — فقط وقتی رویدادی واقعاً رخ بدهد ساخته می‌شوند، از همان لحظه قفل هستند و
        هیچ فایل قفل‌شده‌ای — نه دستی و نه خودکار — حذف نمی‌شود.
      </p>

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
