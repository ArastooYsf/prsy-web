"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import type { ProductFiltersContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

const ROWS: { key: keyof ProductFiltersContent; label: string }[] = [
  { key: "brand", label: "برند" },
  { key: "stock", label: "موجودی (فقط کالاهای موجود)" },
  { key: "price", label: "بازه‌ی قیمت" },
];

export default function ProductFiltersForm({ initialContent }: { initialContent: ProductFiltersContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/product-filters", {
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
      <div className="space-y-3">
        {ROWS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={content[key].enabled}
                onChange={(e) =>
                  setContent((p) => ({ ...p, [key]: { ...p[key], enabled: e.target.checked } }))
                }
                className="size-4 rounded border-foreground/20 accent-accent-500"
              />
              {label}
            </label>
            <div className="w-24 shrink-0">
              <label className="mb-1 block text-xs text-foreground/50">ترتیب</label>
              <input
                type="number"
                dir="ltr"
                min={0}
                value={content[key].order}
                onChange={(e) =>
                  setContent((p) => ({ ...p, [key]: { ...p[key], order: Number(e.target.value) } }))
                }
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-foreground/40">
        فیلترهای مبتنی بر مشخصات فنی (مثل «توان موتور») از صفحه‌ی{" "}
        <a href="/account/admin/products/categories" className="text-accent-400 underline">
          دسته‌بندی‌ها
        </a>{" "}
        مدیریت می‌شوند — چون مشخصات هر دسته با دسته‌ی دیگر فرق دارد.
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
