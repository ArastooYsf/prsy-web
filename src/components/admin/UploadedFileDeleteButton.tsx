"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { UploadedFileSource } from "@/lib/uploaded-files";

type UploadedFileDeleteButtonProps = {
  source: UploadedFileSource;
  id: string;
  filename: string;
};

export default function UploadedFileDeleteButton({ source, id, filename }: UploadedFileDeleteButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [usageMessage, setUsageMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const openConfirm = async () => {
    setOpen(true);
    setUsageMessage("");
    setCheckingUsage(true);

    const res = await fetch(`/api/admin/files/${source}/${id}/usage`);
    if (res.ok) {
      const { usage } = await res.json();
      if (usage.length > 0) {
        setUsageMessage(
          `⚠️ این فایل هم‌اکنون در حال استفاده است:\n${usage.map((u: { label: string }) => `• ${u.label}`).join("\n")}\n\nحذف آن ممکن است تصویر/لینک شکسته باقی بگذارد.`,
        );
      }
    }
    setCheckingUsage(false);
  };

  const confirmDelete = async () => {
    setDeleting(true);

    const res = await fetch(`/api/admin/files/${source}/${id}`, { method: "DELETE" });

    setDeleting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در حذف فایل.", "error");
      return;
    }

    setOpen(false);
    showToast("فایل حذف شد.");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        aria-label={`حذف «${filename}»`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-red-500/30 px-3.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        <Trash2 className="size-3.5" />
        حذف
      </button>
      <ConfirmDialog
        open={open}
        title="حذف فایل"
        message={
          checkingUsage
            ? "در حال بررسی محل استفاده..."
            : `مطمئنید می‌خواهید «${filename}» را برای همیشه حذف کنید؟${usageMessage ? `\n\n${usageMessage}` : ""}`
        }
        confirmLabel="حذف کن"
        danger
        loading={deleting || checkingUsage}
        onConfirm={confirmDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
