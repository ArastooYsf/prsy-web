"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, X } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import FormattedNumberInput from "@/components/ui/FormattedNumberInput";
import { slugify } from "@/lib/slugify";
import { useToast } from "@/components/ToastProvider";
import { useScrollNewestIntoView } from "@/hooks/useScrollNewestIntoView";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import type { ProductSpec } from "@/lib/product-json";
import { resolveSpecTemplate, type SpecTemplates } from "@/lib/product-spec-templates";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type CategoryOption = { id: string; name: string; parentId: string | null; specTemplateKey: string | null };
type BrandOption = { id: string; name: string };

type ProductFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  brands: BrandOption[];
  /** Admin-editable default spec rows per template (see /account/admin/products/spec-templates). */
  specTemplates: SpecTemplates;
  /** Type-to-filter suggestions only — neither field forces a pick from these. */
  unitOptions: string[];
  labelOptions: string[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    images: string[];
    specs: ProductSpec[];
    categoryId: string | null;
    brandId: string | null;
    availability: string;
    showPrice: boolean;
    price: number | null;
    isActive: boolean;
  };
};

export default function ProductForm({ mode, categories, brands, specTemplates, unitOptions, labelOptions, product }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  // "مشخصات فنی" is split into two pieces: `templateValues` holds one entry
  // per label in the current category's template (so its rows always render
  // with a fixed, locked label and only the value is editable), and
  // `customSpecs` holds admin-added label+value pairs that don't belong to
  // any template — either freeform additions, or a template row inherited
  // from a previous category that no longer fits the new one (see
  // handleCategoryChange). Existing specs are partitioned against the
  // initial category's template once, on mount.
  const [templateValues, setTemplateValues] = useState<Record<string, ProductSpec>>(() => {
    const initialTemplate = resolveSpecTemplate(product?.categoryId ?? null, categories, specTemplates);
    const existing = new Map((product?.specs ?? []).map((s) => [s.label, s]));
    const values: Record<string, ProductSpec> = {};
    for (const label of initialTemplate) {
      const spec = existing.get(label);
      values[label] = { label, value: spec?.value ?? "", unit: spec?.unit ?? "" };
    }
    return values;
  });
  const [customSpecs, setCustomSpecs] = useState<ProductSpec[]>(() => {
    const initialTemplate = resolveSpecTemplate(product?.categoryId ?? null, categories, specTemplates);
    return (product?.specs ?? []).filter((s) => !initialTemplate.includes(s.label));
  });
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [availability, setAvailability] = useState(product?.availability ?? "IN_STOCK");
  const [showPrice, setShowPrice] = useState(product?.showPrice ?? false);
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const newestSpecRef = useScrollNewestIntoView<HTMLDivElement>(customSpecs.length);

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  const handleName = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const template = useMemo(() => resolveSpecTemplate(categoryId, categories, specTemplates), [categoryId, categories, specTemplates]);

  // Switching category swaps in that category's template without ever
  // discarding data: everything currently on screen (template rows + custom
  // rows) is flattened, then re-split against the NEW template — a label
  // that still fits becomes a template row again, anything that doesn't
  // (including a now-orphaned label from the old template, as long as it has
  // a value) survives as a custom row instead of disappearing.
  const handleCategoryChange = (nextCategoryId: string) => {
    const currentFlat: ProductSpec[] = [
      ...template.map((label) => templateValues[label] ?? { label, value: "", unit: "" }),
      ...customSpecs,
    ];
    const nextTemplate = resolveSpecTemplate(nextCategoryId, categories, specTemplates);
    const flatMap = new Map(currentFlat.map((s) => [s.label, s]));
    const nextTemplateValues: Record<string, ProductSpec> = {};
    for (const label of nextTemplate) {
      const spec = flatMap.get(label);
      nextTemplateValues[label] = { label, value: spec?.value ?? "", unit: spec?.unit ?? "" };
    }
    setCategoryId(nextCategoryId);
    setTemplateValues(nextTemplateValues);
    setCustomSpecs(currentFlat.filter((s) => !nextTemplate.includes(s.label) && s.value.trim()));
  };

  const updateCustomSpec = (index: number, patch: Partial<ProductSpec>) => {
    setCustomSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const addCustomSpec = () => setCustomSpecs((prev) => [...prev, { label: "", value: "", unit: "" }]);
  const updateTemplateSpec = (label: string, patch: Partial<ProductSpec>) =>
    setTemplateValues((prev) => ({ ...prev, [label]: { ...(prev[label] ?? { label, value: "" }), ...patch } }));
  const removeCustomSpec = (index: number) => setCustomSpecs((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("نام محصول الزامی است.", "error");
      return;
    }
    setSaving(true);
    const specs: ProductSpec[] = [
      ...template.map((label) => ({ label, value: (templateValues[label]?.value ?? "").trim(), unit: (templateValues[label]?.unit ?? "").trim() })),
      ...customSpecs.map((s) => ({ label: s.label.trim(), value: s.value.trim(), unit: (s.unit ?? "").trim() })),
    ].filter((s) => s.label && s.value);
    const payload = {
      name,
      slug,
      description: description && description !== "<p></p>" ? description : null,
      images,
      specs,
      categoryId: categoryId || null,
      brandId: brandId || null,
      availability,
      showPrice,
      price: showPrice ? Number(price) || 0 : null,
      isActive,
    };
    const res = await fetch(mode === "create" ? "/api/admin/products" : `/api/admin/products/${product!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در ذخیره محصول.", "error");
      return;
    }
    showToast(mode === "create" ? "محصول ثبت شد." : "تغییرات ذخیره شد.");
    router.push("/account/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/account/admin/products"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به لیست محصولات
        </Link>
        <h1 className="text-sm font-semibold text-foreground/60">{mode === "create" ? "محصول جدید" : "ویرایش محصول"}</h1>
        <button
          type="submit"
          disabled={saving}
          className="mr-auto inline-flex min-h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام محصول</label>
        <input value={name} onChange={(e) => handleName(e.target.value)} className={inputClass} required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">نامک (slug)</label>
        <input
          dir="ltr"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className={inputClass}
          placeholder="product-slug"
        />
      </div>

      <MediaPicker
        label="تصاویر محصول"
        multiple
        value={images}
        onChange={setImages}
        hint="مربعی (نسبت ۱:۱)، حداقل ۸۰۰×۸۰۰ پیکسل با پس‌زمینه‌ی یک‌دست — چون هم در کارت محصول برش می‌خورد و هم در گالری با زوم دیده می‌شود. JPG، PNG یا WEBP، حداکثر ۸ مگابایت."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">دسته‌بندی</label>
          <select value={categoryId} onChange={(e) => handleCategoryChange(e.target.value)} className={inputClass}>
            <option value="">بدون دسته</option>
            {roots.map((root) => (
              <optgroup key={root.id} label={root.name}>
                <option value={root.id}>{root.name} (کلی)</option>
                {childrenOf(root.id).map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">برند</label>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputClass}>
            <option value="">بدون برند</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">وضعیت موجودی</label>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={inputClass}>
          {Object.entries(PRODUCT_AVAILABILITY).map(([value, s]) => (
            <option key={value} value={value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={showPrice}
            onChange={(e) => setShowPrice(e.target.checked)}
            className="h-4 w-4 rounded border-foreground/20 accent-accent-500"
          />
          نمایش قیمت روی سایت
        </label>
        {showPrice && (
          <div className="mt-3 max-w-xs">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">قیمت (تومان)</label>
            <FormattedNumberInput value={price} onChange={setPrice} className={inputClass} />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/80">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-foreground/20 accent-accent-500"
        />
        محصول فعال (روی سایت نمایش داده شود)
      </label>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیحات</label>
        <RichTextEditor value={description} onChange={setDescription} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">مشخصات فنی</label>
        <p className="mb-2 text-xs text-foreground/40">
          فیلدهای زیر بر اساس دسته‌بندی انتخاب‌شده پیشنهاد می‌شن؛ هرکدوم که برای این محصول کاربرد نداره رو خالی بذارید.
        </p>
        {/* Native <datalist>: filters as you type, never forces a pick, and
            costs no custom dropdown code — the two fields below are free
            text with suggestions, per the product spec. */}
        <datalist id="spec-unit-options">
          {unitOptions.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <datalist id="spec-label-options">
          {labelOptions.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>

        <div className="space-y-2">
          {template.map((label) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem]">
              <div
                className={`${inputClass} col-span-2 flex select-none items-center bg-foreground/10 font-medium text-foreground/70 sm:col-span-1`}
              >
                {label}
              </div>
              <input
                value={templateValues[label]?.value ?? ""}
                onChange={(e) => updateTemplateSpec(label, { value: e.target.value })}
                className={inputClass}
                placeholder="مقدار (اختیاری)"
              />
              <input
                value={templateValues[label]?.unit ?? ""}
                onChange={(e) => updateTemplateSpec(label, { unit: e.target.value })}
                list="spec-unit-options"
                aria-label={`واحد ${label}`}
                className={inputClass}
                placeholder="واحد"
              />
            </div>
          ))}
        </div>

        {customSpecs.length > 0 && (
          <div className="mt-2 space-y-2">
            {customSpecs.map((spec, index) => (
              <div
                key={index}
                ref={index === customSpecs.length - 1 ? newestSpecRef : undefined}
                className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_2.75rem]"
              >
                <input
                  value={spec.label}
                  onChange={(e) => updateCustomSpec(index, { label: e.target.value })}
                  list="spec-label-options"
                  aria-label="عنوان مشخصه"
                  className={`${inputClass} col-span-2 sm:col-span-1`}
                  placeholder="عنوان (مثلاً توان)"
                />
                <input
                  value={spec.value}
                  onChange={(e) => updateCustomSpec(index, { value: e.target.value })}
                  className={inputClass}
                  placeholder="مقدار (مثلاً ۵۰۰)"
                />
                <input
                  value={spec.unit ?? ""}
                  onChange={(e) => updateCustomSpec(index, { unit: e.target.value })}
                  list="spec-unit-options"
                  aria-label="واحد مشخصه"
                  className={inputClass}
                  placeholder="واحد"
                />
                <button
                  type="button"
                  onClick={() => removeCustomSpec(index)}
                  aria-label="حذف ردیف"
                  className="col-span-2 flex min-h-11 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10 sm:col-span-1"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addCustomSpec}
          className="mt-2 inline-flex items-center gap-1 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Plus className="size-3.5" />
          افزودن مشخصه‌ی دیگر
        </button>
      </div>
    </form>
  );
}
