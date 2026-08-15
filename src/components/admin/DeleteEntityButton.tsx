"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

type DeleteEntityButtonProps = {
  endpoint: string;
  title: string;
  message: string;
  redirectTo?: string;
  label?: string;
  className?: string;
};

export default function DeleteEntityButton({
  endpoint,
  title,
  message,
  redirectTo,
  label = "حذف",
  className,
}: DeleteEntityButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setDeleting(true);
    setError("");

    const res = await fetch(endpoint, { method: "DELETE" });

    setDeleting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در حذف.");
      return;
    }

    setOpen(false);
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-red-500/30 px-3.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
        }
      >
        <Trash2 className="size-3.5" />
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={error || message}
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
