"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import type { DownloadsContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function DownloadsContentForm({ initialContent }: { initialContent: DownloadsContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/downloads", {
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
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">لینک کاتالوگ (از هاست دانلود)</label>
        <input
          dir="ltr"
          value={content.catalogUrl}
          onChange={(e) => setContent((p) => ({ ...p, catalogUrl: e.target.value }))}
          className={inputClass}
          placeholder="https://download.example.com/catalog.pdf"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">لینک ویدیوی معرفی (از هاست دانلود)</label>
        <input
          dir="ltr"
          value={content.introVideoUrl}
          onChange={(e) => setContent((p) => ({ ...p, introVideoUrl: e.target.value }))}
          className={inputClass}
          placeholder="https://download.example.com/intro.mp4"
        />
      </div>
      <p className="text-xs text-foreground/40">
        فایل را مستقیم روی هاست دانلود آپلود کنید و لینکش را اینجا بچسبانید — اختیاری، خالی بماند چیزی نمایش داده نمی‌شود.
      </p>
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
