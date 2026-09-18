"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useToast } from "@/components/ToastProvider";
import type { LegalPageKey } from "@/lib/site-content";
import type { LegalPageHeadingContent } from "@/lib/site-content-defaults";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type LegalPageFormProps = {
  page: LegalPageKey;
  initialHtml: string;
  /** Only terms/privacy/warranty have their own hero heading — contact-intro's hero belongs to /contact, edited there. */
  initialHeading?: LegalPageHeadingContent;
};

export default function LegalPageForm({ page, initialHtml, initialHeading }: LegalPageFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [html, setHtml] = useState(initialHtml);
  const [heading, setHeading] = useState(initialHeading);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/legal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, html, heading }),
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
      {heading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">چشم انداز (بالای عنوان)</label>
            <input
              value={heading.eyebrow}
              onChange={(e) => setHeading((prev) => prev && { ...prev, eyebrow: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان صفحه</label>
            <input
              value={heading.heading}
              onChange={(e) => setHeading((prev) => prev && { ...prev, heading: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}
      <RichTextEditor value={html} onChange={setHtml} />
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
