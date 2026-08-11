"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker from "@/components/admin/MediaPicker";
import SimpleRichTextEditor from "@/components/admin/SimpleRichTextEditor";
import IconPicker from "@/components/admin/IconPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";
import type { HeroSlideContent, ProductCategoryContent } from "@/lib/site-content-defaults";
import type { CategoryIconKey } from "@/lib/category-icons";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

const CONDITION_OPTIONS: { value: "new" | "used" | "service"; label: string }[] = [
  { value: "new", label: "نو" },
  { value: "used", label: "دست‌دوم" },
  { value: "service", label: "خدمات" },
];

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptySlide(): HeroSlideContent {
  return { id: genId("slide"), title: "", description: "", ctaLabel: "بیشتر بدانید", ctaHref: "/products", image: "" };
}

function emptyCategory(): ProductCategoryContent {
  return { id: genId("category"), title: "", description: "", iconKey: "box", conditions: ["new"], brands: [], image: "" };
}

type SiteContentFormProps = {
  initialHeroSlides: HeroSlideContent[];
  initialCategories: ProductCategoryContent[];
};

export default function SiteContentForm({ initialHeroSlides, initialCategories }: SiteContentFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [heroSlides, setHeroSlides] = useState<HeroSlideContent[]>(initialHeroSlides);
  const [categories, setCategories] = useState<ProductCategoryContent[]>(initialCategories);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "slide" | "category"; index: number } | null>(null);

  const updateSlide = (index: number, patch: Partial<HeroSlideContent>) => {
    setHeroSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const updateCategory = (index: number, patch: Partial<ProductCategoryContent>) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const toggleCondition = (index: number, condition: "new" | "used" | "service") => {
    const category = categories[index];
    const has = category.conditions.includes(condition);
    updateCategory(index, {
      conditions: has ? category.conditions.filter((c) => c !== condition) : [...category.conditions, condition],
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "slide") {
      setHeroSlides((prev) => prev.filter((_, i) => i !== deleteTarget.index));
    } else {
      setCategories((prev) => prev.filter((_, i) => i !== deleteTarget.index));
    }
    setDeleteTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/admin/site-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroSlides, productCategories: categories }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در ذخیره تغییرات.");
      return;
    }

    showToast("تغییرات ذخیره شد.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-accent-400">اسلایدر صفحه اصلی (Hero)</h3>
          <button
            type="button"
            onClick={() => setHeroSlides((prev) => [...prev, emptySlide()])}
            className="rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-2 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            + افزودن اسلاید
          </button>
        </div>
        <div className="space-y-6">
          {heroSlides.map((slide, i) => (
            <div key={slide.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">اسلاید {i + 1}</p>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ type: "slide", index: i })}
                  className="text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                >
                  حذف اسلاید
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
                  <input value={slide.title} onChange={(e) => updateSlide(i, { title: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیحات</label>
                  <SimpleRichTextEditor value={slide.description} onChange={(html) => updateSlide(i, { description: html })} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن دکمه</label>
                    <input value={slide.ctaLabel} onChange={(e) => updateSlide(i, { ctaLabel: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground/80">لینک دکمه</label>
                    <input dir="ltr" value={slide.ctaHref} onChange={(e) => updateSlide(i, { ctaHref: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <MediaPicker
                  label="تصویر"
                  multiple={false}
                  value={slide.image ? [slide.image] : []}
                  onChange={(paths) => updateSlide(i, { image: paths[0] ?? "" })}
                />
              </div>
            </div>
          ))}
          {heroSlides.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-foreground/50">
              هیچ اسلایدی وجود ندارد.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-accent-400">دسته‌بندی محصولات</h3>
          <button
            type="button"
            onClick={() => setCategories((prev) => [...prev, emptyCategory()])}
            className="rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-2 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            + افزودن دسته
          </button>
        </div>
        <div className="space-y-6">
          {categories.map((category, i) => (
            <div key={category.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">{category.title || `دسته ${i + 1}`}</p>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ type: "category", index: i })}
                  className="text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                >
                  حذف دسته
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
                  <input
                    value={category.title}
                    onChange={(e) => updateCategory(i, { title: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیحات</label>
                  <SimpleRichTextEditor
                    value={category.description}
                    onChange={(html) => updateCategory(i, { description: html })}
                  />
                </div>

                <IconPicker value={category.iconKey} onChange={(key: CategoryIconKey) => updateCategory(i, { iconKey: key })} />

                <div>
                  <p className="mb-1.5 block text-sm font-medium text-foreground/80">وضعیت محصول</p>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleCondition(i, opt.value)}
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                          category.conditions.includes(opt.value)
                            ? "border-accent-500/50 bg-accent-500/10 text-accent-400"
                            : "border-white/10 text-foreground/60 hover:border-white/20"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">برندها (با ویرگول جدا کنید)</label>
                  <input
                    value={category.brands.join("، ")}
                    onChange={(e) =>
                      updateCategory(i, {
                        brands: e.target.value
                          .split(/[,،]/)
                          .map((b) => b.trim())
                          .filter(Boolean),
                      })
                    }
                    className={inputClass}
                    placeholder="مثلاً: کاترپیلار، کامینز، پرکینز"
                  />
                </div>

                <MediaPicker
                  label="تصویر (اختیاری)"
                  multiple={false}
                  value={category.image ? [category.image] : []}
                  onChange={(paths) => updateCategory(i, { image: paths[0] ?? "" })}
                />
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-foreground/50">
              هیچ دسته‌ای وجود ندارد.
            </p>
          )}
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="sticky bottom-4 rounded-full bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === "slide" ? "حذف اسلاید" : "حذف دسته"}
        message={
          deleteTarget?.type === "slide"
            ? "این اسلاید حذف شود؟ برای اعمال نهایی باید «ذخیره تغییرات» را هم بزنید."
            : "این دسته حذف شود؟ برای اعمال نهایی باید «ذخیره تغییرات» را هم بزنید."
        }
        confirmLabel="حذف کن"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </form>
  );
}
