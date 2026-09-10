"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import SimpleRichTextEditor from "@/components/admin/SimpleRichTextEditor";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { HeroSlideContent } from "@/lib/site-content-defaults";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptySlide(): HeroSlideContent {
  return { id: genId("slide"), title: "", description: "", ctaLabel: "بیشتر بدانید", ctaHref: "/products", image: "" };
}

type SiteContentFormProps = {
  initialHeroSlides: HeroSlideContent[];
};

export default function SiteContentForm({ initialHeroSlides }: SiteContentFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [heroSlides, setHeroSlides] = useState<HeroSlideContent[]>(initialHeroSlides);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ index: number } | null>(null);

  const updateSlide = (index: number, patch: Partial<HeroSlideContent>) => {
    setHeroSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setHeroSlides((prev) => prev.filter((_, i) => i !== deleteTarget.index));
    setDeleteTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroSlides }),
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
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-accent-400">اسلایدر صفحه اصلی (Hero)</h3>
          <button
            type="button"
            onClick={() => setHeroSlides((prev) => [...prev, emptySlide()])}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            <Plus className="size-3.5" />
            افزودن اسلاید
          </button>
        </div>
        <div className="space-y-6">
          {heroSlides.map((slide, i) => (
            <div key={slide.id} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">اسلاید {i + 1}</p>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ index: i })}
                  className="inline-flex min-h-11 items-center text-xs font-medium text-red-400 transition-colors hover:text-red-300"
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
            <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/50">
              هیچ اسلایدی وجود ندارد.
            </p>
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="sticky bottom-4 rounded-full bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف اسلاید"
        message="این اسلاید حذف شود؟ برای اعمال نهایی باید «ذخیره تغییرات» را هم بزنید."
        confirmLabel="حذف کن"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </form>
  );
}
