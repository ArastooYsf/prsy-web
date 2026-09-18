"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { SocialProofContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function SocialProofContentForm({ initialContent }: { initialContent: SocialProofContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [deleteTestimonial, setDeleteTestimonial] = useState<number | null>(null);

  const confirmDeleteTestimonial = () => {
    if (deleteTestimonial === null) return;
    setContent((prev) => ({ ...prev, testimonials: prev.testimonials.filter((_, i) => i !== deleteTestimonial) }));
    setDeleteTestimonial(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/socialproof", {
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
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-accent-400">آمار و ارقام</h4>
          <button
            type="button"
            onClick={() => setContent((p) => ({ ...p, stats: [...p.stats, { value: 0, suffix: "+", label: "" }] }))}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            <Plus className="size-3.5" />
            افزودن آمار
          </button>
        </div>
        <div className="space-y-3">
          {content.stats.map((stat, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] items-end gap-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/70">عدد</label>
                <input
                  type="number"
                  value={stat.value}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      stats: p.stats.map((x, xi) => (xi === i ? { ...x, value: Number(e.target.value) || 0 } : x)),
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/70">پسوند</label>
                <input
                  value={stat.suffix}
                  onChange={(e) =>
                    setContent((p) => ({ ...p, stats: p.stats.map((x, xi) => (xi === i ? { ...x, suffix: e.target.value } : x)) }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/70">برچسب</label>
                <input
                  value={stat.label}
                  onChange={(e) =>
                    setContent((p) => ({ ...p, stats: p.stats.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)) }))
                  }
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => setContent((p) => ({ ...p, stats: p.stats.filter((_, xi) => xi !== i) }))}
                aria-label="حذف"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-accent-400">صنایع مشتریان (برچسب‌ها)</h4>
          <button
            type="button"
            onClick={() => setContent((p) => ({ ...p, sectors: [...p.sectors, ""] }))}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            <Plus className="size-3.5" />
            افزودن برچسب
          </button>
        </div>
        <div className="space-y-2">
          {content.sectors.map((sector, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={sector}
                onChange={(e) =>
                  setContent((p) => ({ ...p, sectors: p.sectors.map((x, xi) => (xi === i ? e.target.value : x)) }))
                }
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setContent((p) => ({ ...p, sectors: p.sectors.filter((_, xi) => xi !== i) }))}
                aria-label="حذف"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-accent-400">نظرات مشتریان</h4>
          <button
            type="button"
            onClick={() => setContent((p) => ({ ...p, testimonials: [...p.testimonials, { quote: "", name: "", role: "" }] }))}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            <Plus className="size-3.5" />
            افزودن نظر
          </button>
        </div>
        <div className="space-y-4">
          {content.testimonials.map((testimonial, i) => (
            <div key={i} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">نظر {i + 1}</p>
                <button
                  type="button"
                  onClick={() => setDeleteTestimonial(i)}
                  className="inline-flex min-h-9 items-center text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                >
                  حذف
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن نظر</label>
                  <textarea
                    value={testimonial.quote}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        testimonials: p.testimonials.map((x, xi) => (xi === i ? { ...x, quote: e.target.value } : x)),
                      }))
                    }
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام</label>
                    <input
                      value={testimonial.name}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          testimonials: p.testimonials.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)),
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground/80">سمت</label>
                    <input
                      value={testimonial.role}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          testimonials: p.testimonials.map((x, xi) => (xi === i ? { ...x, role: e.target.value } : x)),
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {content.testimonials.length === 0 && (
            <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/50">
              هنوز نظری اضافه نشده است.
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>

      <ConfirmDialog
        open={deleteTestimonial !== null}
        title="حذف نظر"
        message="این نظر حذف شود؟ برای اعمال نهایی باید «ذخیره تغییرات» را هم بزنید."
        confirmLabel="حذف کن"
        danger
        onConfirm={confirmDeleteTestimonial}
        onCancel={() => setDeleteTestimonial(null)}
      />
    </form>
  );
}
