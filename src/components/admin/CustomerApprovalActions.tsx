"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function CustomerApprovalActions({ customerId, customerLabel }: { customerId: string; customerLabel: string }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pendingAction) return;
    setLoading(true);

    await fetch(`/api/admin/customers/${customerId}/approval`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: pendingAction }),
    });

    setLoading(false);
    setPendingAction(null);
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPendingAction("APPROVE")}
          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
        >
          تأیید
        </button>
        <button
          type="button"
          onClick={() => setPendingAction("REJECT")}
          className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
        >
          رد
        </button>
      </div>

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction === "APPROVE" ? "تأیید حساب حقوقی" : "رد حساب حقوقی"}
        message={
          pendingAction === "APPROVE"
            ? `حساب «${customerLabel}» تأیید و فعال شود؟`
            : `حساب «${customerLabel}» رد شود؟ مشتری تا تغییر وضعیت نمی‌تواند وارد شود.`
        }
        confirmLabel={pendingAction === "APPROVE" ? "تأیید کن" : "رد کن"}
        danger={pendingAction === "REJECT"}
        loading={loading}
        onConfirm={submit}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
