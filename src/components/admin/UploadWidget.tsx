"use client";

import { useRef, useState } from "react";
import { getMediaUrl } from "@/lib/media";

type UploadedMedia = {
  id: string;
  url: string;
  filename: string;
};

export default function UploadWidget() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState<UploadedMedia[]>([]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError("");

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "خطا در آپلود فایل.");
        continue;
      }

      const { media } = await res.json();
      setUploaded((prev) => [media, ...prev]);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-lg font-bold">آپلود تصویر</h2>
      <p className="mt-1 text-sm text-foreground/60">
        تصاویر مستقیم روی هاست ذخیره می‌شوند (public/media/uploads).
      </p>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-6 py-8 text-center transition-colors hover:border-accent-500/40">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        <span className="text-sm font-medium text-foreground/80">
          {uploading ? "در حال آپلود..." : "برای انتخاب تصویر کلیک کنید"}
        </span>
        <span className="text-xs text-foreground/50">PNG، JPG، WEBP، SVG یا GIF — حداکثر ۸ مگابایت</span>
      </label>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {uploaded.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {uploaded.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-white/10">
              <img
                src={getMediaUrl(item.url)}
                alt={item.filename}
                className="aspect-square w-full object-cover"
              />
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
