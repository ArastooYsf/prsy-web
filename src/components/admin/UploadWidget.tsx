"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media";
import { useToast } from "@/components/ToastProvider";

type UploadedMedia = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
};

export default function UploadWidget() {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedMedia[]>([]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);

    let successCount = 0;
    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        showToast(body?.error || "خطا در آپلود فایل.", "error");
        continue;
      }

      const { media } = await res.json();
      setUploaded((prev) => [media, ...prev]);
      successCount++;
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (successCount > 0) showToast(`${successCount} فایل با موفقیت آپلود شد.`);
  };

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6">
      <h2 className="text-lg font-bold">آپلود سریع به مخزن سایت</h2>
      <p className="mt-1 text-sm text-foreground/60">
        فایل‌ها به مخزن مشترک سایت اضافه می‌شوند و همه‌جا (وبلاگ، محتوای سایت، قرارداد، تیکت) قابل انتخاب هستند.
      </p>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/15 px-6 py-8 text-center transition-colors hover:border-accent-500/40">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        <span className="text-sm font-medium text-foreground/80">
          {uploading ? "در حال آپلود..." : "برای انتخاب تصویر کلیک کنید"}
        </span>
        <span className="text-xs text-foreground/50">تصویر (PNG/JPG/WEBP) یا PDF — به مخزن سایت اضافه می‌شود</span>
      </label>

      {uploaded.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {uploaded.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-foreground/10">
              {item.mimeType.startsWith("image/") ? (
                <div className="relative aspect-square w-full">
                  <Image src={getMediaUrl(item.url)} alt={item.filename} fill sizes="200px" className="object-cover" />
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-foreground/[0.04] p-2">
                  <span className="line-clamp-3 break-words text-center text-[11px] text-foreground/60">
                    {item.filename}
                  </span>
                </div>
              )}
              <p dir="ltr" className="truncate px-2 py-1.5 text-[11px] text-foreground/60">
                {getMediaUrl(item.url)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
