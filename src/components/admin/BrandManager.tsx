"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ToastProvider";
import { getMediaUrl } from "@/lib/media";
import type { Brand } from "@/generated/prisma/client";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Draft = { name: string; description: string; logo: string; order: string };

const EMPTY_DRAFT: Draft = { name: "", description: "", logo: "", order: "0" };

function toDraft(brand: Brand): Draft {
  return {
    name: brand.name,
    description: brand.description ?? "",
    logo: brand.logo ?? "",
    order: String(brand.order),
  };
}

export default function BrandManager({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null); // null = not editing, "new" = creating
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
  };
  const startEdit = (brand: Brand) => {
    setDraft(toDraft(brand));
    setEditingId(brand.id);
  };
  const cancel = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      showToast("نام برند الزامی است.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: draft.name,
      description: draft.description || null,
      logo: draft.logo || null,
      order: Number(draft.order) || 0,
    };
    const url = editingId === "new" ? "/api/admin/products/brands" : `/api/admin/products/brands/${editingId}`;
    const res = await fetch(url, {
      method: editingId === "new" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در ذخیره برند.", "error");
      return;
    }
    showToast(editingId === "new" ? "برند ثبت شد." : "برند به‌روزرسانی شد.");
    cancel();
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/brands/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در حذف برند.", "error");
      return;
    }
    showToast("برند حذف شد.");
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {editingId === null && (
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          برند جدید
        </button>
      )}

      {editingId !== null && (
        <div className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام برند</label>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="مثلاً Caterpillar" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیح کوتاه</label>
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className={inputClass} />
          </div>
          <MediaPicker label="لوگو" multiple={false} value={draft.logo ? [draft.logo] : []} onChange={(p) => setDraft({ ...draft, logo: p[0] ?? "" })} />
          <div className="max-w-[8rem]">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">ترتیب</label>
            <input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} className={inputClass} dir="ltr" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-600 disabled:opacity-60">
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button type="button" onClick={cancel} className="inline-flex min-h-11 items-center rounded-full border border-foreground/10 px-5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20">
              انصراف
            </button>
          </div>
        </div>
      )}

      {brands.length === 0 && editingId === null ? (
        <EmptyState icon={<Tag />} title="هنوز برندی ثبت نشده است." />
      ) : (
        <ul className="space-y-2">
          {brands.map((brand) => (
            <li key={brand.id} className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
                {brand.logo && <Image src={getMediaUrl(brand.logo)} alt="" fill sizes="40px" className="object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{brand.name}</p>
                <p dir="ltr" className="truncate text-xs text-foreground/40">{brand.slug}</p>
              </div>
              <button type="button" onClick={() => startEdit(brand)} aria-label="ویرایش" className="flex size-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                <Pencil className="size-4" />
              </button>
              <button type="button" onClick={() => setDeleteTarget(brand)} aria-label="حذف" className="flex size-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف برند"
        message={deleteTarget ? `برند «${deleteTarget.name}» حذف شود؟` : ""}
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
