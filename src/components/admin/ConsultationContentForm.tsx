"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import type { ConsultationContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function ConsultationContentForm({ initialContent }: { initialContent: ConsultationContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
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
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">چشم‌انداز</label>
        <input value={content.eyebrow} onChange={(e) => setContent((p) => ({ ...p, eyebrow: e.target.value }))} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
        <input value={content.heading} onChange={(e) => setContent((p) => ({ ...p, heading: e.target.value }))} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">زیرعنوان</label>
        <textarea
          value={content.subheading}
          onChange={(e) => setContent((p) => ({ ...p, subheading: e.target.value }))}
          rows={2}
          className={`${inputClass} resize-y`}
        />
      </div>
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
