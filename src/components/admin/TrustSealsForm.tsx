"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { useScrollNewestIntoView } from "@/hooks/useScrollNewestIntoView";
import type { TrustSealContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

function genId() {
  return `seal-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptyItem(): TrustSealContent {
  return { id: genId(), label: "", image: "", href: "" };
}

// Swaps the item at `index` with its neighbor — only those two positions
// change, so the rest of the list keeps its in-progress edit state.
function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function TrustSealsForm({ initialItems }: { initialItems: TrustSealContent[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<TrustSealContent[]>(initialItems);
  const newestItemRef = useScrollNewestIntoView<HTMLDivElement>(items.length);
  const [saving, setSaving] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const updateItem = (index: number, patch: Partial<TrustSealContent>) => {
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

    const res = await fetch("/api/admin/site-content/trust-seals", {
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

    // A row missing its image or link is dropped server-side — reflect that
    // back so the form never shows a row it silently didn't persist.
    const { items: saved } = (await res.json().catch(() => null)) ?? { items };
    if (Array.isArray(saved)) setItems(saved);

    showToast("نمادهای اعتماد ذخیره شد.");
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
          افزودن نماد
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            ref={i === items.length - 1 ? newestItemRef : undefined}
            className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{item.label || `نماد ${i + 1}`}</p>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام (فقط برای مدیریت)</label>
                <input
                  value={item.label}
                  onChange={(e) => updateItem(i, { label: e.target.value })}
                  className={inputClass}
                  placeholder="مثلاً اینماد، ساماندهی"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">لینک مرجع (صفحه تأیید رسمی)</label>
                <input
                  dir="ltr"
                  value={item.href}
                  onChange={(e) => updateItem(i, { href: e.target.value })}
                  className={inputClass}
                  placeholder="https://trustseal.enamad.ir/?id=..."
                />
              </div>
              <div className="sm:col-span-2">
                <MediaPicker label="تصویر نماد" multiple={false} value={item.image ? [item.image] : []} onChange={(paths) => updateItem(i, { image: paths[0] ?? "" })} />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/50">
            هنوز نماد اعتمادی اضافه نشده است.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره نمادهای اعتماد"}
      </button>

      <ConfirmDialog
        open={deleteIndex !== null}
        title="حذف نماد"
        message="این نماد حذف شود؟ برای اعمال نهایی باید «ذخیره نمادهای اعتماد» را هم بزنید."
        confirmLabel="حذف کن"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </form>
  );
}
