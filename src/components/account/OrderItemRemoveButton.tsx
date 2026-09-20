"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";

export default function OrderItemRemoveButton({
  orderId,
  itemId,
  itemLabel,
}: {
  orderId: string;
  itemId: string;
  itemLabel: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/items/${itemId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.error ?? "حذف قلم سفارش با خطا مواجه شد.", "error");
        return;
      }
      showToast("قلم سفارش حذف شد.", "success");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      showToast("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={`حذف ${itemLabel} از سفارش`}
        onClick={() => setConfirmOpen(true)}
        className="flex size-8 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <X className="size-4" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="حذف قلم سفارش"
        message={`آیا از حذف «${itemLabel}» از این سفارش مطمئن هستید؟`}
        confirmLabel="حذف کن"
        danger
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
