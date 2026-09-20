"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker from "@/components/admin/MediaPicker";
import { useToast } from "@/components/ToastProvider";
import type { SiteLogoContent } from "@/lib/site-content-defaults";

export default function SiteLogoForm({ initialContent }: { initialContent: SiteLogoContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [logo, setLogo] = useState(initialContent.logo);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/site-content/site-logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo }),
    });
    setSaving(false);
    if (!res.ok) {
      showToast("خطا در ذخیره‌سازی.", "error");
      return;
    }
    showToast("لوگوی سایت ذخیره شد.");
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <MediaPicker
        label="لوگوی سایت"
        multiple={false}
        value={logo ? [logo] : []}
        onChange={(paths) => setLogo(paths[0] ?? "")}
        hint="تصویر مربعی (ترجیحاً SVG یا PNG شفاف). در هدر و فوتر کنار نام شرکت نمایش داده می‌شود؛ اگر حذف شود، نشان پیش‌فرض «یا» برمی‌گردد."
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره لوگو"}
      </button>
    </div>
  );
}
