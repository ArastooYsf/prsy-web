"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useScrollNewestIntoView } from "@/hooks/useScrollNewestIntoView";
import ProductPicker from "@/components/admin/ProductPicker";
import type { AdminProductSearchResult } from "@/lib/admin-product-search";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Customer = { id: string; label: string };
// productId is null for a manual/custom line item (free-text name, no
// catalog link) — set once a row is linked via ProductPicker. price is a
// snapshot the admin can always override, prefilled from the product's
// catalog price on selection but left blank ("") for a fresh manual row.
type Item = { productId: string | null; productName: string; quantity: number | ""; price: number | "" };

type OrderFormProps = {
  mode: "create" | "edit";
  customers: Customer[];
  order?: {
    id: string;
    userId: string;
    orderNumber: string;
    status: string;
    items: Item[];
  };
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "در انتظار تأیید" },
  { value: "PROCESSING", label: "در حال آماده‌سازی" },
  { value: "SHIPPED", label: "ارسال‌شده" },
  { value: "DELIVERED", label: "تحویل داده‌شده" },
  { value: "CANCELLED", label: "لغوشده" },
];

export default function OrderForm({ mode, customers, order }: OrderFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [userId, setUserId] = useState(order?.userId ?? customers[0]?.id ?? "");
  const [status, setStatus] = useState(order?.status ?? "PENDING");
  const [items, setItems] = useState<Item[]>(
    order?.items && order.items.length > 0 ? order.items : [{ productId: null, productName: "", quantity: 1, price: "" }],
  );
  const [saving, setSaving] = useState(false);
  const [invalidIndexes, setInvalidIndexes] = useState<Set<number>>(new Set());
  const newestItemRef = useScrollNewestIntoView<HTMLDivElement>(items.length);

  const clearInvalid = (index: number) => {
    setInvalidIndexes((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const updateItem = (index: number, field: "quantity" | "price", value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value === "" ? "" : Number(value) } : item)),
    );
    clearInvalid(index);
  };

  const updateManualName = (index: number, name: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, productName: name } : item)));
    clearInvalid(index);
  };

  const selectProduct = (index: number, product: AdminProductSearchResult) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, productId: product.id, productName: product.name, price: product.price ?? "" } : item,
      ),
    );
    clearInvalid(index);
  };

  // Unlinking keeps the name/price as-is (now freely editable) rather than
  // wiping them — the admin is converting a catalog row into a custom one,
  // not starting the row over.
  const clearProduct = (index: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, productId: null } : item)));
  };

  const addItem = () =>
    setItems((prev) => [...prev, { productId: null, productName: "", quantity: 1, price: "" }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      showToast("انتخاب مشتری الزامی است.", "error");
      return;
    }

    // Every row must be fully filled in — a row missing any of the three
    // fields is never silently dropped, since that would submit an order
    // missing an item the user thought they'd added.
    const bad = new Set<number>();
    items.forEach((item, i) => {
      const hasName = !!item.productName.trim();
      const hasQuantity = typeof item.quantity === "number" && item.quantity >= 1;
      const hasPrice = typeof item.price === "number" && item.price >= 0;
      if (!hasName || !hasQuantity || !hasPrice) bad.add(i);
    });

    if (items.length === 0 || bad.size === items.length) {
      setInvalidIndexes(new Set(items.map((_, i) => i)));
      showToast("حداقل یک قلم کالا الزامی است.", "error");
      return;
    }

    if (bad.size > 0) {
      setInvalidIndexes(bad);
      showToast("نام، قیمت و تعداد همه‌ی اقلام سفارش را تکمیل کنید یا ردیف‌های ناقص را حذف کنید.", "error");
      return;
    }

    setInvalidIndexes(new Set());
    const validItems = items as { productId: string | null; productName: string; quantity: number; price: number }[];

    setSaving(true);

    const payload = { userId, status, items: validItems };

    const res = await fetch(mode === "create" ? "/api/admin/orders" : `/api/admin/orders/${order!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ذخیره سفارش.", "error");
      return;
    }

    showToast(mode === "create" ? "سفارش با موفقیت ثبت شد." : "تغییرات سفارش ذخیره شد.");
    router.push("/account/admin/orders");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {order && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">شماره سفارش</label>
          <p dir="ltr" className="text-right text-sm text-foreground/60">
            {order.orderNumber}
          </p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">مشتری</label>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass}>
          {customers.map((c) => (
            <option key={c.id} value={c.id} className="bg-background">
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {mode === "edit" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">وضعیت</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-background">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">اقلام سفارش</label>
        <p className="mb-2 text-xs text-foreground/40">
          یا از کاتالوگ محصولات جست‌وجو و انتخاب کنید، یا نام را برای یک قلم سفارشی/دستی تایپ کنید — در هر دو حالت قیمت قابل ویرایش است.
        </p>
        <div className="space-y-3">
          {items.map((item, index) => {
            const invalid = invalidIndexes.has(index);
            const nameInvalid = invalid && !item.productName.trim();
            const quantityInvalid = invalid && !(typeof item.quantity === "number" && item.quantity >= 1);
            const priceInvalid = invalid && !(typeof item.price === "number" && item.price >= 0);
            return (
              <div
                key={index}
                ref={index === items.length - 1 ? newestItemRef : undefined}
                className="flex flex-wrap items-center gap-2"
              >
                <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
                  <ProductPicker
                    productId={item.productId}
                    productName={item.productName}
                    onManualNameChange={(name) => updateManualName(index, name)}
                    onSelectProduct={(product) => selectProduct(index, product)}
                    onClearProduct={() => clearProduct(index)}
                    invalid={nameInvalid}
                  />
                </div>
                {/* Fixed width lives on the wrapper, not the input itself —
                    inputClass already carries w-full, and combining that with
                    a narrower w-* directly on the same element is an
                    unreliable same-specificity Tailwind conflict (same
                    wrapper-div technique ListFilterBar uses for its date
                    inputs). */}
                <div className="w-20 shrink-0">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    placeholder="تعداد"
                    aria-label="تعداد"
                    className={`${inputClass} ${quantityInvalid ? "border-red-500/50" : ""}`}
                  />
                </div>
                <div className="w-36 shrink-0">
                  <input
                    type="number"
                    min={0}
                    dir="ltr"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    placeholder="قیمت واحد (تومان)"
                    aria-label="قیمت واحد (تومان)"
                    className={`${inputClass} ${priceInvalid ? "border-red-500/50" : ""}`}
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-foreground/10 px-3.5 text-xs text-foreground/60 transition-colors hover:border-red-500/40 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                    حذف
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Plus className="size-3.5" />
          افزودن قلم کالا
        </button>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره"}
      </button>
    </form>
  );
}
