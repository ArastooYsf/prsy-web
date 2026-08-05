"use client";

import { useRef, useState } from "react";

type ContractFileUploadFieldProps = {
  value: string;
  onChange: (relativePath: string) => void;
};

export default function ContractFileUploadField({ value, onChange }: ContractFileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload-contract", { method: "POST", body: formData });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در آپلود فایل.");
      setUploading(false);
      return;
    }

    const { url } = await res.json();
    onChange(url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground/80">فایل PDF قرارداد</p>
      <div className="flex items-center gap-3">
        {value && (
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground/70">
            فایل پیوست شده
          </span>
        )}
        <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-white/15 px-4 py-3 text-center text-sm text-foreground/60 transition-colors hover:border-accent-500/40">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {uploading ? "در حال آپلود..." : value ? "تغییر فایل" : "انتخاب فایل PDF"}
        </label>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
