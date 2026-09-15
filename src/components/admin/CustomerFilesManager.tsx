"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { formatFileSize } from "@/lib/format-number";
import { formatJalali } from "@/lib/jalali";
import { FileTypeIcon, fileKindFromMime } from "@/components/FileTypeIcon";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";
import { useToast } from "@/components/ToastProvider";

export type CustomerFileItem = {
  id: string;
  title: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function CustomerFilesManager({ customerId, files }: { customerId: string; files: CustomerFileItem[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      showToast("یک فایل انتخاب کنید.", "error");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());

    const res = await fetch(`/api/admin/customers/${customerId}/files`, { method: "POST", body: formData });

    setUploading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در آپلود فایل.", "error");
      return;
    }

    setTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("فایل با موفقیت اضافه شد.", "success");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <p className="text-sm text-foreground/50">هنوز فایلی برای این مشتری ثبت نشده است.</p>
      ) : (
        <div className="space-y-2.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5">
                  <FileTypeIcon kind={fileKindFromMime(file.mimeType)} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.title}</p>
                  <p dir="ltr" className="mt-0.5 text-right text-xs text-foreground/50">
                    {formatFileSize(file.size)} · {formatJalali(file.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getMediaUrl(file.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-9 items-center gap-1.5 rounded-full border border-foreground/10 px-3 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                >
                  <Download className="size-3.5" />
                  دانلود
                </a>
                <DeleteEntityButton
                  endpoint={`/api/admin/customers/${customerId}/files/${file.id}`}
                  title="حذف فایل"
                  message={`مطمئنید می‌خواهید فایل «${file.title}» را حذف کنید؟`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-foreground/15 p-4">
        <div className="min-w-40 flex-1">
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">عنوان (اختیاری)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="مثلاً کاتالوگ محصولات ۱۴۰۴"
          />
        </div>
        <div className="min-w-48 flex-1">
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">فایل (تصویر، PDF یا DOCX)</label>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf,.docx" className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="size-4" />
          {uploading ? "در حال آپلود..." : "افزودن فایل"}
        </button>
      </form>
    </div>
  );
}
