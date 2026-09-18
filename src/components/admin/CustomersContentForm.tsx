"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import IconPicker from "@/components/admin/IconPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { useScrollNewestIntoView } from "@/hooks/useScrollNewestIntoView";
import type { CustomersContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function CustomersContentForm({ initialContent }: { initialContent: CustomersContent }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState(initialContent);
  const newestRef = useScrollNewestIntoView<HTMLDivElement>(content.segments.length);
  const [saving, setSaving] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const updateSegment = (index: number, patch: Partial<CustomersContent["segments"][number]>) => {
    setContent((prev) => ({ ...prev, segments: prev.segments.map((a, i) => (i === index ? { ...a, ...patch } : a)) }));
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    setContent((prev) => ({ ...prev, segments: prev.segments.filter((_, i) => i !== deleteIndex) }));
    setDeleteIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/customers", {
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
          <h4 className="text-sm font-bold text-accent-400">بخش‌بندی مشتریان</h4>
          <button
            type="button"
            onClick={() => setContent((p) => ({ ...p, segments: [...p.segments, { title: "", description: "", icon: "bank" }] }))}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
          >
            <Plus className="size-3.5" />
            افزودن بخش
          </button>
        </div>
        <div className="space-y-4">
          {content.segments.map((segment, i) => (
            <div
              key={i}
              ref={i === content.segments.length - 1 ? newestRef : undefined}
              className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">بخش {i + 1}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setContent((p) => ({ ...p, segments: move(p.segments, i, -1) }))}
                    disabled={i === 0}
                    aria-label="جابه‌جایی به بالا"
                    className="flex size-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((p) => ({ ...p, segments: move(p.segments, i, 1) }))}
                    disabled={i === content.segments.length - 1}
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
                <IconPicker label="آیکون" value={segment.icon} onChange={(icon) => updateSegment(i, { icon })} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
                  <input value={segment.title} onChange={(e) => updateSegment(i, { title: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیحات</label>
                  <textarea
                    value={segment.description}
                    onChange={(e) => updateSegment(i, { description: e.target.value })}
                    rows={2}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>
            </div>
          ))}
          {content.segments.length === 0 && (
            <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/50">
              هنوز بخشی اضافه نشده است.
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
        open={deleteIndex !== null}
        title="حذف بخش"
        message="این بخش حذف شود؟ برای اعمال نهایی باید «ذخیره تغییرات» را هم بزنید."
        confirmLabel="حذف کن"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </form>
  );
}
