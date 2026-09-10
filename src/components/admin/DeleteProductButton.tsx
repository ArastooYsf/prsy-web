"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در حذف محصول.", "error");
      return;
    }
    setOpen(false);
    showToast("محصول حذف شد.");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-red-500/30 px-3.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        <Trash2 className="size-3.5" />
        حذف
      </button>
      <ConfirmDialog
        open={open}
        title="حذف محصول"
        message={`محصول «${name}» حذف شود؟ این عملیات قابل بازگشت نیست.`}
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
