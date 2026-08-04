"use client";

import { useRef, useState } from "react";
import { getMediaUrl } from "@/lib/media";

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (relativePath: string) => void;
};

export default function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در آپلود فایل.");
      setUploading(false);
      return;
    }

    const { media } = await res.json();
    onChange(media.url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</p>
      <div className="flex items-center gap-3">
        {value && (
          <img
            src={getMediaUrl(value)}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg border border-white/10 object-cover"
          />
        )}
        <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-white/15 px-4 py-3 text-center text-sm text-foreground/60 transition-colors hover:border-accent-500/40">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {uploading ? "در حال آپلود..." : value ? "تغییر تصویر" : "انتخاب تصویر"}
        </label>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
