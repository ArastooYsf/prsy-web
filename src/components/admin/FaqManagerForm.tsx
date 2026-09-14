"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { FaqItemContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

function genId() {
  return `faq-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptyItem(): FaqItemContent {
  return { id: genId(), question: "", answer: "" };
}

// Swaps the item at `index` with its neighbor at `index + direction` — the
// only two array positions that change, so nothing else in the list
// re-renders or loses its in-progress edit state.
function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function FaqManagerForm({ initialItems }: { initialItems: FaqItemContent[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<FaqItemContent[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const updateItem = (index: number, patch: Partial<FaqItemContent>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    setItems((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/site-content/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ذخیره تغییرات.", "error");
      return;
    }

    // Rows with an empty question/answer are dropped server-side (see the
    // route) — reflect that back here so the form never shows stale rows
    // it silently didn't persist.
    const { items: saved } = (await res.json().catch(() => null)) ?? { items };
    if (Array.isArray(saved)) setItems(saved);

    showToast("سوالات متداول ذخیره شد.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20"
        >
          <Plus className="size-3.5" />
          افزودن سوال
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.id} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">سوال {i + 1}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setItems((prev) => move(prev, i, -1))}
                  disabled={i === 0}
                  aria-label="جابه‌جایی به بالا"
                  className="flex size-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setItems((prev) => move(prev, i, 1))}
                  disabled={i === items.length - 1}
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">سوال</label>
                <input value={item.question} onChange={(e) => updateItem(i, { question: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">پاسخ</label>
                <textarea
                  value={item.answer}
                  onChange={(e) => updateItem(i, { answer: e.target.value })}
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/50">
            هنوز سوالی اضافه نشده است.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره سوالات متداول"}
      </button>

      <ConfirmDialog
        open={deleteIndex !== null}
        title="حذف سوال"
        message="این سوال حذف شود؟ برای اعمال نهایی باید «ذخیره سوالات متداول» را هم بزنید."
        confirmLabel="حذف کن"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </form>
  );
}
