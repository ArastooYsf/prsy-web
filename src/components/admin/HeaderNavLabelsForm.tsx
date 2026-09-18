"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import type { HeaderNavLabelsContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

const FIELDS: { key: keyof HeaderNavLabelsContent; label: string }[] = [
  { key: "home", label: "خانه" },
  { key: "about", label: "درباره ما" },
  { key: "clients", label: "مشتریان" },
  { key: "blog", label: "وبلاگ" },
  { key: "faq", label: "سوالات متداول" },
];

export default function HeaderNavLabelsForm({ initialContent }: { initialContent: HeaderNavLabelsContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/header", {
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
      <p className="text-xs text-foreground/50">فقط متن نمایشی هر آیتم منو قابل‌ویرایش است؛ ترتیب و مقصد لینک‌ها ثابت می‌ماند.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</label>
            <input
              value={content[key]}
              onChange={(e) => setContent((p) => ({ ...p, [key]: e.target.value }))}
              className={inputClass}
            />
          </div>
        ))}
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
