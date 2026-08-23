"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media";
import { toPersianDigits } from "@/lib/format-number";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FileTypeIcon, fileKindFromMime } from "@/components/FileTypeIcon";
import { useToast } from "@/components/ToastProvider";
import Skeleton from "react-loading-skeleton";

export type MediaAsset = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  canDelete: boolean;
};

type MediaKind = "image" | "file" | "all";

// Which bucket this picker instance reads/writes — keeps the admin site-content
// gallery from being polluted by customer ticket attachments (and vice versa).
export type MediaScope = "SITE_CONTENT" | "TICKET_ATTACHMENT" | "PROFILE_AVATAR" | "CONTRACT_FILE";

type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (assets: MediaAsset[]) => void;
  kind?: MediaKind;
  scope?: MediaScope;
  multiple?: boolean;
  initialSelected?: string[];
};

const KIND_LABEL: Record<MediaKind, string> = {
  image: "انتخاب تصویر",
  file: "انتخاب فایل",
  all: "انتخاب فایل یا تصویر",
};

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const KIND_ACCEPT: Record<MediaKind, string> = {
  image: "image/png,image/jpeg,image/webp",
  file: `application/pdf,${DOCX_MIME_TYPE}`,
  all: `image/png,image/jpeg,image/webp,application/pdf,${DOCX_MIME_TYPE}`,
};

const KIND_HINT: Record<MediaKind, string> = {
  image: "PNG، JPG یا WEBP — حداکثر ۸ مگابایت",
  file: "PDF یا DOCX — حداکثر ۱۵ مگابایت",
  all: "تصویر (PNG/JPG/WEBP) تا ۸ مگابایت، یا PDF/DOCX تا ۱۵ مگابایت",
};

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return toPersianDigits(`${Math.round(bytes / 1024)} کیلوبایت`);
  return toPersianDigits(`${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`);
}

export default function MediaPickerModal({
  open,
  onClose,
  onConfirm,
  kind = "image",
  scope = "SITE_CONTENT",
  multiple = true,
  initialSelected = [],
}: MediaPickerModalProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"gallery" | "upload">("gallery");
  const [gallery, setGallery] = useState<MediaAsset[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [draftSelected, setDraftSelected] = useState<string[]>(initialSelected);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageMessage, setUsageMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraftSelected(initialSelected);
    setTab("gallery");
    fetchGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, scope]);

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
    const res = await fetch(`/api/media?type=${kind}&scope=${scope}`);
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

    const newPaths: string[] = [];

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("scope", scope);

      const res = await fetch("/api/media/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        showToast(body?.error || "خطا در آپلود یک یا چند فایل.", "error");
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

  const openDeleteConfirm = async (item: MediaAsset) => {
    setDeleteTarget(item);
    setUsageMessage("");
    setUsageLoading(true);

    const res = await fetch(`/api/media/${item.id}/usage`);
    if (res.ok) {
      const { usage } = await res.json();
      if (usage.length > 0) {
        setUsageMessage(`این فایل هم‌اکنون استفاده شده است:\n${usage.map((u: { label: string }) => `• ${u.label}`).join("\n")}`);
      }
    }
    setUsageLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const res = await fetch(`/api/media/${deleteTarget.id}`, { method: "DELETE" });

    if (res.ok) {
      setGallery((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDraftSelected((prev) => prev.filter((p) => p !== deleteTarget.url));
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const confirm = () => {
    const assets = gallery.filter((g) => draftSelected.includes(g.url));
    onConfirm(assets);
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
          <h3 className="text-base font-bold">{KIND_LABEL[kind]}</h3>
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
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : gallery.length === 0 ? (
              <p className="py-10 text-center text-sm text-foreground/50">هنوز فایلی آپلود نشده است.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {gallery.map((item) => {
                  const selected = draftSelected.includes(item.url);
                  const isImage = isImageMime(item.mimeType);
                  return (
                    <div key={item.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.url)}
                        className={`relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 transition-colors ${
                          selected ? "border-accent-500" : "border-transparent hover:border-white/20"
                        }`}
                      >
                        {isImage ? (
                          <Image src={getMediaUrl(item.url)} alt={item.filename} fill sizes="200px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white/[0.04] p-2">
                            <FileTypeIcon kind={fileKindFromMime(item.mimeType)} className="h-6 w-6" />
                            <span className="line-clamp-2 w-full break-words text-center text-[10px] text-foreground/60">
                              {item.filename}
                            </span>
                          </div>
                        )}
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

                      {item.canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(item);
                          }}
                          aria-label="حذف از مخزن"
                          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-6 py-12 text-center transition-colors hover:border-accent-500/40">
              <input
                ref={fileInputRef}
                type="file"
                accept={KIND_ACCEPT[kind]}
                multiple={multiple}
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleUpload(e.target.files)}
              />
              <span className="text-sm font-medium text-foreground/80">
                {uploading ? "در حال آپلود..." : "برای انتخاب فایل کلیک کنید"}
              </span>
              <span className="text-xs text-foreground/50">{KIND_HINT[kind]}</span>
            </label>
          )}

        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="text-xs text-foreground/50">{draftSelected.length} مورد انتخاب‌شده</span>
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
              disabled={draftSelected.length === 0}
              className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              انتخاب
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف از مخزن سایت"
        message={
          usageLoading
            ? "در حال بررسی محل استفاده..."
            : `مطمئنید می‌خواهید «${deleteTarget?.filename ?? ""}» (${
                deleteTarget ? formatSize(deleteTarget.size) : ""
              }) را برای همیشه حذف کنید؟${usageMessage ? `\n\n${usageMessage}` : ""}`
        }
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
