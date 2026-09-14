"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import SimpleRichTextEditor from "@/components/admin/SimpleRichTextEditor";
import { useToast } from "@/components/ToastProvider";
import type { LegalPageKey } from "@/lib/site-content";

type LegalPageFormProps = {
  page: LegalPageKey;
  initialHtml: string;
};

export default function LegalPageForm({ page, initialHtml }: LegalPageFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [html, setHtml] = useState(initialHtml);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/legal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, html }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ذخیره تغییرات.", "error");
      return;
    }

    showToast("تغییرات ذخیره شد.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SimpleRichTextEditor value={html} onChange={setHtml} />
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="size-4" />
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </form>
  );
}
