import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listLogFiles } from "@/lib/logger";

export const dynamic = "force-dynamic";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

export default async function AdminLogsPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const files = await listLogFiles();

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold">گزارش رویدادها</h2>
      <p className="mb-6 text-sm text-foreground/50">
        هر عملیات مهم (ایجاد، ویرایش، حذف، تغییر وضعیت) در فایل‌های روزانه‌ی JSON Lines زیر ثبت می‌شود.
      </p>

      {files.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-foreground/50">
          هنوز هیچ رویدادی ثبت نشده است.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs text-foreground/50">
              <tr>
                <th className="px-4 py-3 text-right font-medium">تاریخ (شمسی)</th>
                <th className="px-4 py-3 text-right font-medium">تعداد رویداد</th>
                <th className="px-4 py-3 text-right font-medium">حجم</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-right font-medium">دانلود</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {files.map((f) => (
                <tr key={f.filename}>
                  <td dir="ltr" className="px-4 py-3 text-right font-mono text-xs text-foreground/80">
                    {f.filename.replace(".jsonl", "")}
                  </td>
                  <td className="px-4 py-3">{f.entryCount.toLocaleString("fa-IR")}</td>
                  <td className="px-4 py-3 text-foreground/60">{formatSize(f.size)}</td>
                  <td className="px-4 py-3">
                    {f.locked ? (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                        قفل‌شده
                      </span>
                    ) : (
                      <span className="text-xs text-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/admin/logs/${f.filename}`}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                    >
                      دانلود
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
