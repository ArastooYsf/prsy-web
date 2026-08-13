"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const [userId, setUserId] = useState(order?.userId ?? customers[0]?.id ?? "");
  const [status, setStatus] = useState(order?.status ?? "PENDING");
  const [items, setItems] = useState<Item[]>(
    order?.items && order.items.length > 0 ? order.items : [{ productName: "", quantity: 1 }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
  };

  const addItem = () => setItems((prev) => [...prev, { productName: "", quantity: 1 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const namedItems = items.filter((item) => item.productName.trim());

    if (!userId || namedItems.length === 0) {
      setError("مشتری و حداقل یک قلم کالا الزامی است.");
      return;
    }

    if (namedItems.some((item) => !(typeof item.quantity === "number" && item.quantity >= 1))) {
      setError("تعداد هر قلم کالا باید حداقل ۱ باشد.");
      return;
    }

    const validItems = namedItems as { productName: string; quantity: number }[];

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
      setError(body?.error || "خطا در ذخیره سفارش.");
      return;
    }

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
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={item.productName}
                onChange={(e) => updateItem(index, "productName", e.target.value)}
                className={inputClass}
                placeholder="نام محصول"
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                className={`${inputClass} w-24`}
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-3 text-xs text-foreground/60 transition-colors hover:border-red-500/40 hover:text-red-400"
                >
                  حذف
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-3 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          + افزودن قلم کالا
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

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
