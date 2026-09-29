"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FolderTree, CornerDownLeft, X } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ToastProvider";
import IconPicker, { type IconPickerOption } from "@/components/admin/IconPicker";
import { CATEGORY_ICON_KEYS, CATEGORY_ICON_LABELS, CATEGORY_ICONS, type CategoryIconKey } from "@/lib/category-icons";
import { resolvedSpecTemplateKey, type SpecTemplates } from "@/lib/product-spec-templates";
import { parseStringArray } from "@/lib/product-json";
import { slugify } from "@/lib/slugify";
import { scrollIntoViewIfNeeded } from "@/lib/scroll-into-view";
import type { ProductCategory } from "@/generated/prisma/client";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Draft = {
  name: string;
  slug: string;
  slugTouched: boolean;
  icon: string;
  order: string;
  parentId: string | null;
  previewSpecKeys: string[];
  filterSpecKeys: string[];
  specTemplateKey: string | null;
};

// Same closed grid the content cards use (IconPicker), fed with the
// category-specific icon set; "" = no icon.
const CATEGORY_ICON_PICKER_OPTIONS: IconPickerOption<string>[] = [
  { key: "", label: "بدون آیکون", icon: <X className="size-[18px]" /> },
  ...CATEGORY_ICON_KEYS.map((key) => ({
    key: key as string,
    label: CATEGORY_ICON_LABELS[key],
    icon: <span className="[&_svg]:size-[18px]">{CATEGORY_ICONS[key]}</span>,
  })),
];

// Module-level, not React state: confirmed empirically (via a render-marker
// log) that router.refresh() — needed here to pull in the newly-created
// category — actually remounts CategoryManager once the fresh data lands,
// resetting every piece of that render's React state (a useState "pending
// scroll target" gets wiped in the very same commit that brings in the
// category it was waiting for, so it's never seen). A plain module variable
// isn't part of the fiber tree, so it survives that remount intact — the
// freshly-mounted instance's own effect below picks it up and finishes the
// scroll. Caveat: this is page-global, not per-instance — fine for this
// page (one CategoryManager, no concurrent create flows), not something to
// copy for a component that could render more than once at a time.
let pendingScrollCategoryId: string | null = null;

function CategoryIcon({ icon }: { icon: string | null }) {
  if (!icon || !(CATEGORY_ICON_KEYS as readonly string[]).includes(icon)) {
    return <FolderTree className="size-4 text-foreground/40" />;
  }
  return <span className="[&_svg]:size-5 text-foreground/60">{CATEGORY_ICONS[icon as CategoryIconKey]}</span>;
}

type CategoryTreeNode = ProductCategory & { children: ProductCategory[] };

function CategoryChildrenList({
  root,
  onEdit,
  onDelete,
  setItemRef,
}: {
  root: CategoryTreeNode;
  onEdit: (c: ProductCategory) => void;
  onDelete: (c: ProductCategory) => void;
  setItemRef: (id: string) => (el: HTMLLIElement | null) => void;
}) {
  if (root.children.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1.5 border-r border-foreground/10 pr-3">
      {root.children.map((child) => (
        <li key={child.id} ref={setItemRef(child.id)} className="flex items-center gap-3 rounded-lg bg-foreground/[0.02] p-2">
          <CornerDownLeft className="size-3.5 text-foreground/30" />
          <CategoryIcon icon={child.icon} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{child.name}</p>
            <p dir="ltr" className="truncate text-xs text-foreground/40">{child.slug}</p>
          </div>
          <button type="button" onClick={() => onEdit(child)} aria-label="ویرایش" className="flex size-11 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
            <Pencil className="size-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(child)} aria-label="حذف" className="flex size-11 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10">
            <Trash2 className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function CategoryManager({ categories, specTemplates }: { categories: ProductCategory[]; specTemplates: SpecTemplates }) {
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

  // Scrolls to a just-created category once it actually appears in `tree`
  // (see the pendingScrollCategoryId comment above for why this doesn't use
  // React state for the pending target).
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  function setItemRef(id: string) {
    return (el: HTMLLIElement | null) => {
      if (el) itemRefs.current.set(id, el);
      else itemRefs.current.delete(id);
    };
  }

  useEffect(() => {
    if (!pendingScrollCategoryId) return;
    const id = pendingScrollCategoryId;
    if (!itemRefs.current.get(id)) return;
    pendingScrollCategoryId = null;

    // The remount this effect runs after (see the comment above) can still
    // be settling its layout across a couple of paints — a single
    // requestAnimationFrame measurement wasn't always enough (confirmed
    // empirically). A *retry loop* made this worse, not better: each retry
    // called scrollBy({behavior: "smooth"}) again before the previous
    // smooth-scroll animation had time to actually progress, restarting it
    // from a barely-moved position every ~16ms instead of letting it run —
    // net result was a small residual scroll, not the full one. A single
    // short, one-shot delay avoids that interruption entirely.
    const timeout = setTimeout(() => {
      const el = itemRefs.current.get(id);
      if (el) scrollIntoViewIfNeeded(el);
    }, 100);
    return () => clearTimeout(timeout);
  }, [tree]);

  // Guards a real edge case: create a category, then navigate away (client-
  // side, same tab) before router.refresh() resolves and the effect above
  // gets to consume pendingScrollCategoryId — since it's module state, not
  // React state, it would otherwise survive that navigation and trigger an
  // unprompted scroll on a later, unrelated visit to this page.
  useEffect(() => {
    return () => {
      pendingScrollCategoryId = null;
    };
  }, []);

  const openCreate = (parentId: string | null) => {
    // Suggest the next free slot among this category's own siblings rather
    // than a fixed "1" — with the new duplicate-order rule below, defaulting
    // every new category to the same number would make the *second* one
    // created under any parent fail validation immediately.
    const siblingOrders = categories.filter((c) => c.parentId === parentId).map((c) => c.order);
    const nextOrder = siblingOrders.length > 0 ? Math.max(...siblingOrders) + 1 : 1;
    setForm({
      mode: "create",
      draft: { name: "", slug: "", slugTouched: false, icon: "", order: String(nextOrder), parentId, previewSpecKeys: [], filterSpecKeys: [], specTemplateKey: null },
    });
  };
  const openEdit = (c: ProductCategory) =>
    setForm({
      mode: "edit",
      id: c.id,
      draft: {
        name: c.name,
        slug: c.slug,
        slugTouched: true,
        icon: c.icon ?? "",
        order: String(c.order),
        parentId: c.parentId,
        previewSpecKeys: parseStringArray(c.previewSpecKeys),
        filterSpecKeys: parseStringArray(c.filterSpecKeys),
        specTemplateKey: c.specTemplateKey,
      },
    });
  const close = () => setForm(null);

  const handleName = (name: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const slug = prev.draft.slugTouched ? prev.draft.slug : slugify(name);
      return { ...prev, draft: { ...prev.draft, name, slug } };
    });
  };

  const togglePreviewSpecKey = (label: string) => {
    // Functional update: several chips toggled in quick succession can land
    // in the same React batch, where each closure would otherwise see the
    // same stale `form` and only the last click would stick.
    setForm((prev) => {
      if (!prev) return prev;
      const current = prev.draft.previewSpecKeys;
      const next = current.includes(label) ? current.filter((l) => l !== label) : [...current, label];
      return { ...prev, draft: { ...prev.draft, previewSpecKeys: next } };
    });
  };

  const toggleFilterSpecKey = (label: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const current = prev.draft.filterSpecKeys;
      const next = current.includes(label) ? current.filter((l) => l !== label) : [...current, label];
      return { ...prev, draft: { ...prev.draft, filterSpecKeys: next } };
    });
  };

  const save = async () => {
    if (!form) return;
    if (!form.draft.name.trim()) {
      showToast("نام دسته الزامی است.", "error");
      return;
    }
    if (!Number.isFinite(Number(form.draft.order)) || Number(form.draft.order) < 1) {
      showToast("ترتیب نمایش باید حداقل ۱ باشد.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.draft.name,
      slug: form.draft.slug,
      icon: form.draft.icon || null,
      order: Number(form.draft.order),
      parentId: form.draft.parentId,
      previewSpecKeys: form.draft.previewSpecKeys,
      filterSpecKeys: form.draft.filterSpecKeys,
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
    if (form.mode === "create") {
      const { category } = await res.json();
      pendingScrollCategoryId = category.id;
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
            <input value={form.draft.name} onChange={(e) => handleName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">نامک (slug)</label>
            <input
              dir="ltr"
              value={form.draft.slug}
              onChange={(e) =>
                setForm({ ...form, draft: { ...form.draft, slug: e.target.value, slugTouched: true } })
              }
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <IconPicker
              label="آیکون"
              value={form.draft.icon}
              onChange={(icon) => setForm({ ...form, draft: { ...form.draft, icon } })}
              options={CATEGORY_ICON_PICKER_OPTIONS}
            />
          </div>
          <div className="max-w-[8rem]">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">ترتیب</label>
            <input type="number" dir="ltr" min={1} value={form.draft.order} onChange={(e) => setForm({ ...form, draft: { ...form.draft, order: e.target.value } })} className={inputClass} />
          </div>

          {/* Only a root category carries its own spec template (see specTemplateKey
              in schema.prisma) — a subcategory always inherits its root's, so picking
              preview fields only makes sense here. */}
          {!form.draft.parentId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                فیلدهای پیش‌نمایش سریع (در کارت محصول)
              </label>
              <p className="mb-2 text-xs text-foreground/50">
                این فیلدها در پاپ‌آپ پیش‌نمایش سریع روی کارت محصول (صفحه‌ی لیست محصولات) نمایش داده می‌شوند. اگر
                چیزی انتخاب نشود، چند مشخصه‌ی اول محصول به‌صورت پیش‌فرض نمایش داده می‌شود.
              </p>
              <div className="flex flex-wrap gap-2">
                {specTemplates[resolvedSpecTemplateKey(form.draft.specTemplateKey)].map((label) => {
                  const checked = form.draft.previewSpecKeys.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => togglePreviewSpecKey(label)}
                      aria-pressed={checked}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        checked
                          ? "border-accent-500/40 bg-accent-500/10 text-accent-400"
                          : "border-foreground/10 text-foreground/60 hover:border-foreground/30"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Same root-only convention as previewSpecKeys above — these become
              the selectable spec facets in the public filter sidebar. */}
          {!form.draft.parentId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                مشخصات قابل‌فیلتر (در فیلترهای صفحه‌ی محصولات)
              </label>
              <p className="mb-2 text-xs text-foreground/50">
                کدام مشخصه‌های این دسته به‌عنوان فیلتر قابل‌انتخاب (مثل توان موتور) کنار لیست محصولات نمایش داده
                شوند. اگر چیزی انتخاب نشود، فیلتر مشخصات نمایش داده نمی‌شود.
              </p>
              <div className="flex flex-wrap gap-2">
                {specTemplates[resolvedSpecTemplateKey(form.draft.specTemplateKey)].map((label) => {
                  const checked = form.draft.filterSpecKeys.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleFilterSpecKey(label)}
                      aria-pressed={checked}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        checked
                          ? "border-accent-500/40 bg-accent-500/10 text-accent-400"
                          : "border-foreground/10 text-foreground/60 hover:border-foreground/30"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            <li key={root.id} ref={setItemRef(root.id)} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={root.icon} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{root.name}</p>
                  <p dir="ltr" className="truncate text-xs text-foreground/40">{root.slug}</p>
                </div>
                <button type="button" onClick={() => openCreate(root.id)} aria-label="افزودن زیردسته" className="flex size-11 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                  <Plus className="size-4" />
                </button>
                <button type="button" onClick={() => openEdit(root)} aria-label="ویرایش" className="flex size-11 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                  <Pencil className="size-4" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(root)} aria-label="حذف" className="flex size-11 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10">
                  <Trash2 className="size-4" />
                </button>
              </div>

              <CategoryChildrenList root={root} onEdit={openEdit} onDelete={setDeleteTarget} setItemRef={setItemRef} />
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
