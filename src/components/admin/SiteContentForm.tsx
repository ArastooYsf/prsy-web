"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker from "@/components/admin/MediaPicker";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

const HERO_SLIDES = [
  { id: "diesel-generators", label: "اسلاید ۱ — دیزل ژنراتور صنعتی و تجاری" },
  { id: "power-engines", label: "اسلاید ۲ — موتور برق خانگی و تجاری" },
  { id: "spare-parts", label: "اسلاید ۳ — قطعات یدکی اورجینال" },
  { id: "overhaul", label: "اسلاید ۴ — خدمات اورهال و تعمیرات" },
];

const PRODUCT_CATEGORIES = [
  { id: "diesel-generators", label: "دیزل ژنراتور" },
  { id: "power-engines", label: "موتور برق" },
  { id: "spare-parts", label: "قطعات یدکی" },
  { id: "generator-engines", label: "موتور ژنراتور" },
  { id: "alternators", label: "دینام / آلترناتور" },
  { id: "overhaul", label: "خدمات اورهال و تعمیرات" },
];

export default function SiteContentForm({ initialValues }: { initialValues: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (key: string) => (value: string) => {
    setSaved(false);
    setValues((v) => ({ ...v, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/admin/site-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: values }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در ذخیره تغییرات.");
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <h3 className="mb-4 text-base font-bold text-accent-400">اسلایدر صفحه اصلی (Hero)</h3>
        <div className="space-y-6">
          {HERO_SLIDES.map((slide) => (
            <div key={slide.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-4 text-sm font-semibold">{slide.label}</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
                  <input
                    value={values[`hero.${slide.id}.title`] ?? ""}
                    onChange={(e) => set(`hero.${slide.id}.title`)(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیحات</label>
                  <textarea
                    rows={2}
                    value={values[`hero.${slide.id}.description`] ?? ""}
                    onChange={(e) => set(`hero.${slide.id}.description`)(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <MediaPicker
                  label="تصویر"
                  multiple={false}
                  value={values[`hero.${slide.id}.image`] ? [values[`hero.${slide.id}.image`]] : []}
                  onChange={(paths) => set(`hero.${slide.id}.image`)(paths[0] ?? "")}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-base font-bold text-accent-400">بخش درباره ما</h3>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
            <input
              value={values["about.title"] ?? ""}
              onChange={(e) => set("about.title")(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن</label>
            <textarea
              rows={4}
              value={values["about.body"] ?? ""}
              onChange={(e) => set("about.body")(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-base font-bold text-accent-400">تصاویر دسته‌بندی محصولات</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRODUCT_CATEGORIES.map((category) => (
            <div key={category.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-sm font-semibold">{category.label}</p>
              <MediaPicker
                label="تصویر"
                multiple={false}
                value={values[`products.${category.id}.image`] ? [values[`products.${category.id}.image`]] : []}
                onChange={(paths) => set(`products.${category.id}.image`)(paths[0] ?? "")}
              />
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="rounded-lg border border-accent-500/30 bg-accent-500/10 px-4 py-2.5 text-sm text-accent-400">
          تغییرات ذخیره شد.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="sticky bottom-4 rounded-full bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </form>
  );
}
