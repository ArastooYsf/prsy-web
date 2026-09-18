"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import IconPicker from "@/components/admin/IconPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { AboutContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function AboutContentForm({ initialContent }: { initialContent: AboutContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const updatePrinciple = (index: number, patch: Partial<AboutContent["principles"][number]>) => {
    setContent((prev) => ({ ...prev, principles: prev.principles.map((a, i) => (i === index ? { ...a, ...patch } : a)) }));
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    setContent((prev) => ({ ...prev, principles: prev.principles.filter((_, i) => i !== deleteIndex) }));
    setDeleteIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/about", {
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
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
          <input value={content.title} onChange={(e) => setContent((p) => ({ ...p, title: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن معرفی</label>
          <textarea
            value={content.body}
            onChange={(e) => setContent((p) => ({ ...p, body: e.target.value }))}
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-accent-400">اصول کاری</h4>
          <button
            type="button"
            onClick={() => setContent((p) => ({ ...p, principles: [...p.principles, { title: "", description: "", icon: "star" }] }))}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            <Plus className="size-3.5" />
            افزودن اصل
          </button>
        </div>
        <div className="space-y-4">
          {content.principles.map((principle, i) => (
            <div key={i} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">اصل {i + 1}</p>
                <button
                  type="button"
                  onClick={() => setDeleteIndex(i)}
                  className="inline-flex min-h-9 items-center text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                >
                  حذف
                </button>
              </div>
              <div className="space-y-3">
                <IconPicker label="آیکون" value={principle.icon} onChange={(icon) => updatePrinciple(i, { icon })} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
                  <input value={principle.title} onChange={(e) => updatePrinciple(i, { title: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیح</label>
                  <input
                    value={principle.description}
                    onChange={(e) => updatePrinciple(i, { description: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
          {content.principles.length === 0 && (
            <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/50">
              هنوز اصلی اضافه نشده است.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <h4 className="mb-4 text-sm font-bold text-accent-400">آمار و نشان اعتماد</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">سال سابقه (عدد)</label>
            <input
              type="number"
              value={content.yearsValue}
              onChange={(e) => setContent((p) => ({ ...p, yearsValue: Number(e.target.value) || 0 }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">شماره ثبت</label>
            <input
              value={content.registrationNumber}
              onChange={(e) => setContent((p) => ({ ...p, registrationNumber: e.target.value }))}
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">برچسب شماره ثبت</label>
            <input
              value={content.registrationLabel}
              onChange={(e) => setContent((p) => ({ ...p, registrationLabel: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان نشان اعتماد</label>
            <input
              value={content.trustBadgeTitle}
              onChange={(e) => setContent((p) => ({ ...p, trustBadgeTitle: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن نشان اعتماد</label>
            <textarea
              value={content.trustBadgeText}
              onChange={(e) => setContent((p) => ({ ...p, trustBadgeText: e.target.value }))}
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </div>
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
        open={deleteIndex !== null}
        title="حذف اصل"
        message="این اصل حذف شود؟ برای اعمال نهایی باید «ذخیره تغییرات» را هم بزنید."
        confirmLabel="حذف کن"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </form>
  );
}
