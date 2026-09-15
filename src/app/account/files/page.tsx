import { getServerSession } from "next-auth";
import { Download } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { formatFileSize } from "@/lib/format-number";
import { formatJalali } from "@/lib/jalali";
import { FileTypeIcon, fileKindFromMime } from "@/components/FileTypeIcon";
import { debugSlowLoad } from "@/lib/debug-slow-load";

export const dynamic = "force-dynamic";

export default async function AccountFilesPage() {
  await debugSlowLoad();

  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const files = await prisma.customerFile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
        <Download className="size-5 text-accent-400" />
        دانلود فایل‌ها
      </h2>

      {files.length === 0 ? (
        <EmptyState
          icon={<Download />}
          title="هنوز فایلی برای شما ثبت نشده است."
          description="کاتالوگ‌ها و پیوست‌هایی که تیم ما مخصوص شما آماده کنه، همین‌جا در دسترس قرار می‌گیره."
        />
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5">
                  <FileTypeIcon kind={fileKindFromMime(file.mimeType)} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{file.title}</p>
                  <p dir="ltr" className="mt-1 text-right text-xs text-foreground/50">
                    {formatFileSize(file.size)} · {formatJalali(file.createdAt.toISOString())}
                  </p>
                </div>
              </div>
              <a
                href={getMediaUrl(file.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
              >
                <Download className="size-4" />
                دانلود
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
