"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { SPEC_TEMPLATE_NAMES, type SpecTemplateKey, type SpecTemplates } from "@/lib/product-spec-templates";
import { toPersianDigits } from "@/lib/format-number";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";
const iconButtonClass =
  "flex size-11 shrink-0 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-foreground/10 disabled:hover:text-foreground/60";

// Rows are keyed by a generated id, not their text — the text is editable,
// and a text key would remount (and drop focus from) the input on every keystroke.
type Row = { id: number; label: string };
type Draft = Record<SpecTemplateKey, Row[]>;

let nextId = 1;
const toRows = (labels: readonly string[]): Row[] => labels.map((label) => ({ id: nextId++, label }));

export default function SpecTemplatesForm({ initialTemplates }: { initialTemplates: SpecTemplates }) {
  const router = useRouter();
  const { showToast } = useToast();
  const keys = Object.keys(initialTemplates) as SpecTemplateKey[];
  const [draft, setDraft] = useState<Draft>(() => Object.fromEntries(keys.map((k) => [k, toRows(initialTemplates[k])])) as Draft);
  const [saving, setSaving] = useState(false);

  const update = (key: SpecTemplateKey, fn: (rows: Row[]) => Row[]) => setDraft((prev) => ({ ...prev, [key]: fn(prev[key]) }));
  const move = (key: SpecTemplateKey, index: number, dir: -1 | 1) =>
    update(key, (rows) => {
      const target = index + dir;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    const templates = Object.fromEntries(keys.map((k) => [k, draft[k].map((r) => r.label.trim()).filter(Boolean)]));
    const res = await fetch("/api/admin/spec-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templates }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ذخیره تغییرات.", "error");
      return;
    }
    showToast("مشخصات پیش‌فرض ذخیره شد.");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {keys.map((key) => (
        <section key={key} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
          <h3 className="mb-1 text-base font-bold text-accent-400">{SPEC_TEMPLATE_NAMES[key]}</h3>
          <p className="mb-4 text-xs text-foreground/50">
            حذف یا تغییر عنوان یک ردیف، مقدارِ ثبت‌شده‌ی محصولات قبلی را پاک نمی‌کند؛ آن مشخصه در فرم آن محصول به‌عنوان ردیف دلخواه دیده می‌شود.
          </p>

          <ul className="space-y-2">
            {draft[key].map((row, index) => (
              <li key={row.id} className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-center text-xs text-foreground/40">{toPersianDigits(index + 1)}</span>
                <input
                  value={row.label}
                  onChange={(e) => update(key, (rows) => rows.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)))}
                  aria-label={`عنوان ردیف ${toPersianDigits(index + 1)}`}
                  className={inputClass}
                />
                <button type="button" onClick={() => move(key, index, -1)} disabled={index === 0} aria-label="انتقال به بالا" className={iconButtonClass}>
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(key, index, 1)}
                  disabled={index === draft[key].length - 1}
                  aria-label="انتقال به پایین"
                  className={iconButtonClass}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => update(key, (rows) => rows.filter((r) => r.id !== row.id))}
                  aria-label="حذف ردیف"
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
            {draft[key].length === 0 && <li className="rounded-lg border border-dashed border-foreground/15 p-4 text-center text-sm text-foreground/50">هیچ ردیفی وجود ندارد.</li>}
          </ul>

          <button
            type="button"
            onClick={() => update(key, (rows) => [...rows, { id: nextId++, label: "" }])}
            className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-full border border-foreground/10 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Plus className="size-3.5" />
            افزودن ردیف
          </button>
        </section>
      ))}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="sticky bottom-4 rounded-full bg-accent-500 px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </div>
  );
}
