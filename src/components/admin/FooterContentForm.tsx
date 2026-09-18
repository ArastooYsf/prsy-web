"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import type { FooterEditableContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function FooterContentForm({ initialContent }: { initialContent: FooterEditableContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const updateLinkLabel = (list: "quickLinks" | "services", id: string, label: string) => {
    setContent((prev) => ({ ...prev, [list]: prev[list].map((link) => (link.id === id ? { ...link, label } : link)) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/footer", {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن معرفی زیر لوگو</label>
        <textarea
          value={content.tagline}
          onChange={(e) => setContent((p) => ({ ...p, tagline: e.target.value }))}
          rows={2}
          className={`${inputClass} resize-y`}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن حق نشر (بعد از سال و نام شرکت)</label>
        <input value={content.copyrightSuffix} onChange={(e) => setContent((p) => ({ ...p, copyrightSuffix: e.target.value }))} className={inputClass} />
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <h4 className="mb-4 text-sm font-bold text-accent-400">لینک‌های سریع</h4>
        <p className="mb-3 text-xs text-foreground/50">فقط متن لینک قابل‌ویرایش است؛ مقصد هر لینک ثابت می‌ماند.</p>
        <div className="space-y-2">
          {content.quickLinks.map((link) => (
            <input
              key={link.id}
              value={link.label}
              onChange={(e) => updateLinkLabel("quickLinks", link.id, e.target.value)}
              className={inputClass}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <h4 className="mb-4 text-sm font-bold text-accent-400">لینک‌های محصولات</h4>
        <p className="mb-3 text-xs text-foreground/50">فقط متن لینک قابل‌ویرایش است؛ مقصد هر لینک ثابت می‌ماند.</p>
        <div className="space-y-2">
          {content.services.map((link) => (
            <input
              key={link.id}
              value={link.label}
              onChange={(e) => updateLinkLabel("services", link.id, e.target.value)}
              className={inputClass}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </form>
  );
}
