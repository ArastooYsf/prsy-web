"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, X } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { slugify } from "@/lib/slugify";
import { useToast } from "@/components/ToastProvider";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import type { ProductSpec } from "@/lib/product-json";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type CategoryOption = { id: string; name: string; parentId: string | null };
type BrandOption = { id: string; name: string };

type ProductFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  brands: BrandOption[];
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

export default function ProductForm({ mode, categories, brands, product }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [specs, setSpecs] = useState<ProductSpec[]>(product?.specs ?? []);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [availability, setAvailability] = useState(product?.availability ?? "IN_STOCK");
  const [showPrice, setShowPrice] = useState(product?.showPrice ?? false);
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  const handleName = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const updateSpec = (index: number, patch: Partial<ProductSpec>) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const addSpec = () => setSpecs((prev) => [...prev, { label: "", value: "" }]);
  const removeSpec = (index: number) => setSpecs((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("نام محصول الزامی است.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name,
      slug,
      description: description && description !== "<p></p>" ? description : null,
      images,
      specs: specs.filter((s) => s.label.trim() && s.value.trim()),
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

      <MediaPicker label="تصاویر محصول" multiple value={images} onChange={setImages} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">دسته‌بندی</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
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
            <input type="number" min="0" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
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
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground/80">مشخصات فنی</label>
          <button
            type="button"
            onClick={addSpec}
            className="inline-flex items-center gap-1 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Plus className="size-3.5" />
            افزودن ردیف
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((spec, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={spec.label}
                onChange={(e) => updateSpec(index, { label: e.target.value })}
                className={inputClass}
                placeholder="عنوان (مثلاً توان)"
              />
              <input
                value={spec.value}
                onChange={(e) => updateSpec(index, { value: e.target.value })}
                className={inputClass}
                placeholder="مقدار (مثلاً ۵۰۰ کیلووات)"
              />
              <button
                type="button"
                onClick={() => removeSpec(index)}
                aria-label="حذف ردیف"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {specs.length === 0 && <p className="text-xs text-foreground/40">هنوز مشخصه‌ای اضافه نشده است.</p>}
        </div>
      </div>
    </form>
  );
}
