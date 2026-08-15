"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeletePostButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`پست «${title}» حذف شود؟ این عملیات قابل بازگشت نیست.`)) return;

    setDeleting(true);
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setDeleting(false);

    if (res.ok) {
      router.refresh();
    } else {
      window.alert("خطا در حذف پست.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-red-500/30 px-3.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
    >
      <Trash2 className="size-3.5" />
      {deleting ? "..." : "حذف"}
    </button>
  );
}
