"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

type PendingAction = "APPROVE" | "REJECT" | "DELETE";

export default function ProductCommentActions({
  commentId,
  commentLabel,
  status,
}: {
  commentId: string;
  commentLabel: string;
  status: string;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pendingAction) return;
    setLoading(true);

    if (pendingAction === "DELETE") {
      await fetch(`/api/admin/product-comments/${commentId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/product-comments/${commentId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pendingAction }),
      });
    }

    setLoading(false);
    setPendingAction(null);
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2">
        {status !== "APPROVED" && (
          <button
            type="button"
            onClick={() => setPendingAction("APPROVE")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            <Check className="size-3.5" />
            تأیید
          </button>
        )}
        {status !== "REJECTED" && (
          <button
            type="button"
            onClick={() => setPendingAction("REJECT")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
          >
            <X className="size-3.5" />
            رد
          </button>
        )}
        <button
          type="button"
          onClick={() => setPendingAction("DELETE")}
          aria-label="حذف دیدگاه"
          className="inline-flex size-11 items-center justify-center rounded-full border border-foreground/10 text-foreground/50 transition-colors hover:border-red-500/30 hover:text-red-400"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <ConfirmDialog
        open={!!pendingAction}
        title={
          pendingAction === "APPROVE" ? "تأیید دیدگاه" : pendingAction === "REJECT" ? "رد دیدگاه" : "حذف دیدگاه"
        }
        message={
          pendingAction === "APPROVE"
            ? `دیدگاه «${commentLabel}» تأیید و در صفحه‌ی محصول نمایش داده شود؟`
            : pendingAction === "REJECT"
              ? `دیدگاه «${commentLabel}» رد شود و نمایش داده نشود؟`
              : `دیدگاه «${commentLabel}» برای همیشه حذف شود؟ این کار قابل بازگشت نیست.`
        }
        confirmLabel={pendingAction === "APPROVE" ? "تأیید کن" : pendingAction === "REJECT" ? "رد کن" : "حذف کن"}
        danger={pendingAction === "REJECT" || pendingAction === "DELETE"}
        loading={loading}
        onConfirm={submit}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
