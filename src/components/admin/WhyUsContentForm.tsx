"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import IconPicker from "@/components/admin/IconPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { useScrollNewestIntoView } from "@/hooks/useScrollNewestIntoView";
import type { WhyUsContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function WhyUsContentForm({ initialContent }: { initialContent: WhyUsContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const newestRef = useScrollNewestIntoView<HTMLDivElement>(content.advantages.length);
  const [saving, setSaving] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const updateAdvantage = (index: number, patch: Partial<WhyUsContent["advantages"][number]>) => {
    setContent((prev) => ({ ...prev, advantages: prev.advantages.map((a, i) => (i === index ? { ...a, ...patch } : a)) }));
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    setContent((prev) => ({ ...prev, advantages: prev.advantages.filter((_, i) => i !== deleteIndex) }));
    setDeleteIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/whyus", {
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
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">چشم‌انداز</label>
          <input value={content.eyebrow} onChange={(e) => setContent((p) => ({ ...p, eyebrow: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
          <input value={content.heading} onChange={(e) => setContent((p) => ({ ...p, heading: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">زیرعنوان</label>
          <textarea
            value={content.subheading}
            onChange={(e) => setContent((p) => ({ ...p, subheading: e.target.value }))}
            rows={2}
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-accent-400">مزیت‌ها</h4>
          <button
            type="button"
            onClick={() =>
              setContent((p) => ({ ...p, advantages: [...p.advantages, { title: "", description: "", icon: "package" }] }))
            }
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            <Plus className="size-3.5" />
            افزودن مزیت
          </button>
        </div>
        <div className="space-y-4">
          {content.advantages.map((advantage, i) => (
            <div
              key={i}
              ref={i === content.advantages.length - 1 ? newestRef : undefined}
              className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">مزیت {i + 1}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setContent((p) => ({ ...p, advantages: move(p.advantages, i, -1) }))}
                    disabled={i === 0}
                    aria-label="جابه‌جایی به بالا"
                    className="flex size-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((p) => ({ ...p, advantages: move(p.advantages, i, 1) }))}
                    disabled={i === content.advantages.length - 1}
                    aria-label="جابه‌جایی به پایین"
                    className="flex size-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteIndex(i)}
                    className="mr-1 inline-flex min-h-9 items-center px-2 text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                  >
                    حذف
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <IconPicker label="آیکون" value={advantage.icon} onChange={(icon) => updateAdvantage(i, { icon })} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
                  <input value={advantage.title} onChange={(e) => updateAdvantage(i, { title: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیحات</label>
                  <textarea
                    value={advantage.description}
                    onChange={(e) => updateAdvantage(i, { description: e.target.value })}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>
            </div>
          ))}
          {content.advantages.length === 0 && (
            <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/50">
              هنوز مزیتی اضافه نشده است.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <h4 className="mb-4 text-sm font-bold text-accent-400">همکاران و مشتریان</h4>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان بخش</label>
            <input
              value={content.partnersLabel}
              onChange={(e) => setContent((p) => ({ ...p, partnersLabel: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیح بخش</label>
            <input
              value={content.partnersSubtext}
              onChange={(e) => setContent((p) => ({ ...p, partnersSubtext: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">لیست همکاران</label>
            <div className="space-y-2">
              {content.partners.map((partner, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={partner}
                    onChange={(e) =>
                      setContent((p) => ({ ...p, partners: p.partners.map((x, xi) => (xi === i ? e.target.value : x)) }))
                    }
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setContent((p) => ({ ...p, partners: p.partners.filter((_, xi) => xi !== i) }))}
                    aria-label="حذف"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setContent((p) => ({ ...p, partners: [...p.partners, ""] }))}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-foreground/10 px-3 text-xs font-semibold text-foreground/70 transition-colors hover:bg-foreground/10"
              >
                <Plus className="size-3.5" />
                افزودن همکار
              </button>
            </div>
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
        title="حذف مزیت"
        message="این مزیت حذف شود؟ برای اعمال نهایی باید «ذخیره تغییرات» را هم بزنید."
        confirmLabel="حذف کن"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </form>
  );
}
