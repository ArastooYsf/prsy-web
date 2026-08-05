"use client";

import { useEffect, useRef, useState } from "react";
import { getMediaUrl } from "@/lib/media";

type MediaAsset = {
  id: string;
  url: string;
  filename: string;
};

type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (paths: string[]) => void;
  multiple?: boolean;
  initialSelected?: string[];
};

export default function MediaPickerModal({
  open,
  onClose,
  onConfirm,
  multiple = true,
  initialSelected = [],
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<"gallery" | "upload">("gallery");
  const [gallery, setGallery] = useState<MediaAsset[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [draftSelected, setDraftSelected] = useState<string[]>(initialSelected);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftSelected(initialSelected);
    setTab("gallery");
    setError("");
    fetchGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const fetchGallery = async () => {
    setLoadingGallery(true);
    const res = await fetch("/api/admin/media");
    if (res.ok) {
      const { media } = await res.json();
      setGallery(media);
    }
    setLoadingGallery(false);
  };

  const toggleSelect = (path: string) => {
    if (!multiple) {
      setDraftSelected([path]);
      return;
    }
    setDraftSelected((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError("");

    const newPaths: string[] = [];

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "خطا در آپلود یک یا چند فایل.");
        continue;
      }

      const { media } = await res.json();
      setGallery((prev) => [media, ...prev]);
      newPaths.push(media.url);
    }

    if (newPaths.length > 0) {
      setDraftSelected((prev) => (multiple ? [...prev, ...newPaths] : [newPaths[newPaths.length - 1]]));
      setTab("gallery");
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirm = () => {
    onConfirm(draftSelected);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-bold">انتخاب تصویر</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 border-b border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={() => setTab("gallery")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === "gallery" ? "bg-accent-500 text-white" : "border border-white/10 text-foreground/70 hover:border-accent-500/40"
            }`}
          >
            گالری
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === "upload" ? "bg-accent-500 text-white" : "border border-white/10 text-foreground/70 hover:border-accent-500/40"
            }`}
          >
            آپلود
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "gallery" ? (
            loadingGallery ? (
              <p className="py-10 text-center text-sm text-foreground/50">در حال بارگذاری...</p>
            ) : gallery.length === 0 ? (
              <p className="py-10 text-center text-sm text-foreground/50">هنوز تصویری آپلود نشده است.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {gallery.map((item) => {
                  const selected = draftSelected.includes(item.url);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleSelect(item.url)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                        selected ? "border-accent-500" : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <img src={getMediaUrl(item.url)} alt={item.filename} className="h-full w-full object-cover" />
                      {selected && (
                        <span className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-white">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M5 13l4 4L19 7"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-6 py-12 text-center transition-colors hover:border-accent-500/40">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple={multiple}
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleUpload(e.target.files)}
              />
              <span className="text-sm font-medium text-foreground/80">
                {uploading ? "در حال آپلود..." : "برای انتخاب فایل کلیک کنید"}
              </span>
              <span className="text-xs text-foreground/50">PNG، JPG یا WEBP — حداکثر ۸ مگابایت</span>
            </label>
          )}

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="text-xs text-foreground/50">{draftSelected.length} تصویر انتخاب‌شده</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-white/20"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={confirm}
              className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
            >
              انتخاب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
