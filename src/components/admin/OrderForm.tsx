"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Customer = { id: string; label: string };
type Item = { productName: string; quantity: number | "" };

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
    order?.items && order.items.length > 0 ? order.items : [{ productName: "", quantity: 1 }],
  );
  const [saving, setSaving] = useState(false);
  const [invalidIndexes, setInvalidIndexes] = useState<Set<number>>(new Set());

  const updateItem = (index: number, field: keyof Item, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "quantity") {
          return { ...item, quantity: value === "" ? "" : Number(value) };
        }
        return { ...item, productName: value };
      }),
    );
    setInvalidIndexes((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { productName: "", quantity: 1 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      showToast("انتخاب مشتری الزامی است.", "error");
      return;
    }

    // Every row must be fully filled in — a row with only one of the two
    // fields set is never silently dropped, since that would submit an
    // order missing an item the user thought they'd added.
    const bad = new Set<number>();
    items.forEach((item, i) => {
      const hasName = !!item.productName.trim();
      const hasQuantity = typeof item.quantity === "number" && item.quantity >= 1;
      if (!hasName || !hasQuantity) bad.add(i);
    });

    if (items.length === 0 || bad.size === items.length) {
      setInvalidIndexes(new Set(items.map((_, i) => i)));
      showToast("حداقل یک قلم کالا الزامی است.", "error");
      return;
    }

    if (bad.size > 0) {
      setInvalidIndexes(bad);
      showToast("نام و تعداد همه‌ی اقلام سفارش را تکمیل کنید یا ردیف‌های ناقص را حذف کنید.", "error");
      return;
    }

    setInvalidIndexes(new Set());
    const validItems = items as { productName: string; quantity: number }[];

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
        <div className="space-y-3">
          {items.map((item, index) => {
            const invalid = invalidIndexes.has(index);
            return (
            <div key={index} className="flex items-center gap-2">
              <input
                value={item.productName}
                onChange={(e) => updateItem(index, "productName", e.target.value)}
                className={invalid && !item.productName.trim() ? `${inputClass} border-red-500/50` : inputClass}
                placeholder="نام محصول"
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                className={
                  invalid && !(typeof item.quantity === "number" && item.quantity >= 1)
                    ? `${inputClass} w-24 border-red-500/50`
                    : `${inputClass} w-24`
                }
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-white/10 px-3.5 text-xs text-foreground/60 transition-colors hover:border-red-500/40 hover:text-red-400"
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
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
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
