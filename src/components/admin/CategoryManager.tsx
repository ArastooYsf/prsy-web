"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FolderTree, CornerDownLeft } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ToastProvider";
import { CATEGORY_ICON_KEYS, CATEGORY_ICON_LABELS, CATEGORY_ICONS, type CategoryIconKey } from "@/lib/category-icons";
import type { ProductCategory } from "@/generated/prisma/client";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Draft = { name: string; icon: string; order: string; parentId: string | null };

function CategoryIcon({ icon }: { icon: string | null }) {
  if (!icon || !(CATEGORY_ICON_KEYS as readonly string[]).includes(icon)) {
    return <FolderTree className="size-4 text-foreground/40" />;
  }
  return <span className="[&_svg]:size-5 text-foreground/60">{CATEGORY_ICONS[icon as CategoryIconKey]}</span>;
}

export default function CategoryManager({ categories }: { categories: ProductCategory[] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const tree = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    return roots.map((root) => ({
      ...root,
      children: categories.filter((c) => c.parentId === root.id),
    }));
  }, [categories]);

  // form state: { mode: "create" | "edit", parentId, id? }
  const [form, setForm] = useState<{ mode: "create" | "edit"; id?: string; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = (parentId: string | null) =>
    setForm({ mode: "create", draft: { name: "", icon: "", order: "0", parentId } });
  const openEdit = (c: ProductCategory) =>
    setForm({ mode: "edit", id: c.id, draft: { name: c.name, icon: c.icon ?? "", order: String(c.order), parentId: c.parentId } });
  const close = () => setForm(null);

  const save = async () => {
    if (!form) return;
    if (!form.draft.name.trim()) {
      showToast("نام دسته الزامی است.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.draft.name,
      icon: form.draft.icon || null,
      order: Number(form.draft.order) || 0,
      parentId: form.draft.parentId,
    };
    const url = form.mode === "create" ? "/api/admin/products/categories" : `/api/admin/products/categories/${form.id}`;
    const res = await fetch(url, {
      method: form.mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در ذخیره دسته.", "error");
      return;
    }
    showToast(form.mode === "create" ? "دسته ثبت شد." : "دسته به‌روزرسانی شد.");
    close();
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/categories/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در حذف دسته.", "error");
      return;
    }
    showToast("دسته حذف شد.");
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {form === null && (
        <button
          type="button"
          onClick={() => openCreate(null)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          دسته‌ی اصلی جدید
        </button>
      )}

      {form !== null && (
        <div className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-sm font-semibold text-foreground/70">
            {form.mode === "create"
              ? form.draft.parentId
                ? "زیردسته‌ی جدید"
                : "دسته‌ی اصلی جدید"
              : "ویرایش دسته"}
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام</label>
            <input value={form.draft.name} onChange={(e) => setForm({ ...form, draft: { ...form.draft, name: e.target.value } })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">آیکون</label>
            <select value={form.draft.icon} onChange={(e) => setForm({ ...form, draft: { ...form.draft, icon: e.target.value } })} className={inputClass}>
              <option value="">بدون آیکون</option>
              {CATEGORY_ICON_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_ICON_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="max-w-[8rem]">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">ترتیب</label>
            <input type="number" dir="ltr" value={form.draft.order} onChange={(e) => setForm({ ...form, draft: { ...form.draft, order: e.target.value } })} className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-600 disabled:opacity-60">
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button type="button" onClick={close} className="inline-flex min-h-11 items-center rounded-full border border-foreground/10 px-5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20">
              انصراف
            </button>
          </div>
        </div>
      )}

      {tree.length === 0 && form === null ? (
        <EmptyState icon={<FolderTree />} title="هنوز دسته‌بندی‌ای ثبت نشده است." />
      ) : (
        <ul className="space-y-2">
          {tree.map((root) => (
            <li key={root.id} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={root.icon} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{root.name}</p>
                  <p dir="ltr" className="truncate text-xs text-foreground/40">{root.slug}</p>
                </div>
                <button type="button" onClick={() => openCreate(root.id)} aria-label="افزودن زیردسته" className="flex size-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                  <Plus className="size-4" />
                </button>
                <button type="button" onClick={() => openEdit(root)} aria-label="ویرایش" className="flex size-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                  <Pencil className="size-4" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(root)} aria-label="حذف" className="flex size-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10">
                  <Trash2 className="size-4" />
                </button>
              </div>

              {root.children.length > 0 && (
                <ul className="mt-2 space-y-1.5 border-r border-foreground/10 pr-3">
                  {root.children.map((child) => (
                    <li key={child.id} className="flex items-center gap-3 rounded-lg bg-foreground/[0.02] p-2">
                      <CornerDownLeft className="size-3.5 text-foreground/30" />
                      <CategoryIcon icon={child.icon} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{child.name}</p>
                        <p dir="ltr" className="truncate text-xs text-foreground/40">{child.slug}</p>
                      </div>
                      <button type="button" onClick={() => openEdit(child)} aria-label="ویرایش" className="flex size-8 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(child)} aria-label="حذف" className="flex size-8 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10">
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف دسته"
        message={deleteTarget ? `دسته‌ی «${deleteTarget.name}» حذف شود؟` : ""}
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
