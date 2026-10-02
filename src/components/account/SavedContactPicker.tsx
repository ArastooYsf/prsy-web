"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidIranPhone } from "@/lib/validation";
import { useToast } from "@/components/ToastProvider";
import type { LocateResult } from "@/components/account/AddressMapPicker";

// Leaflet touches `window` at import time — safe only once loaded
// client-side, same ssr:false pattern EmojiPicker.tsx uses for
// @emoji-mart/react.
const AddressMapPicker = dynamic(() => import("@/components/account/AddressMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-lg border border-foreground/10 text-xs text-foreground/40">
      در حال بارگذاری نقشه...
    </div>
  ),
});

type SavedContactKind = "phone" | "address";

type SavedItem = {
  id: string;
  value: string;
  label: string | null;
  isDefault: boolean;
};

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

const CONFIG: Record<
  SavedContactKind,
  {
    apiBase: string;
    listKey: "phones" | "addresses";
    valueField: "phone" | "address";
    title: string;
    addLabel: string;
    placeholder: string;
    emptyText: string;
  }
> = {
  phone: {
    apiBase: "/api/account/phones",
    listKey: "phones",
    valueField: "phone",
    title: "شماره تماس",
    addLabel: "افزودن شماره جدید",
    placeholder: "۰۹۱۲۳۴۵۶۷۸۹",
    emptyText: "هنوز شماره تماسی ثبت نکرده‌اید.",
  },
  address: {
    apiBase: "/api/account/addresses",
    listKey: "addresses",
    valueField: "address",
    title: "آدرس",
    addLabel: "افزودن آدرس جدید",
    placeholder: "آدرس پستی برای ارسال سفارش‌ها و مکاتبات",
    emptyText: "هنوز آدرسی ثبت نکرده‌اید.",
  },
};

// Self-contained "pick a saved phone/address, or add a new one" section —
// every action (select, add, delete) saves immediately via its own request,
// independent of whatever form it's embedded in (same pattern as
// EmailChangeSection.tsx elsewhere in ProfileForm). Reused as-is in both
// ProfileForm (managing the address book) and CheckoutFlow's contact step
// (picking which saved entry this order uses) — selecting an item marks it
// the account default, which is also what order creation/SMS/PDFs read.
export default function SavedContactPicker({ kind }: { kind: SavedContactKind }) {
  const cfg = CONFIG[kind];
  const { showToast } = useToast();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState(""); // phone number (kind === "phone")
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  // Address-specific structured fields (kind === "address") — pre-filled by
  // AddressMapPicker's onLocate, always manually editable afterward.
  const [newProvince, setNewProvince] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newPlaque, setNewPlaque] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);

  const resetAddForm = () => {
    setNewValue("");
    setNewLabel("");
    setNewProvince("");
    setNewCity("");
    setNewStreet("");
    setNewPlaque("");
    setNewPostalCode("");
    setNewLat(null);
    setNewLng(null);
  };

  const applyLocate = (result: LocateResult) => {
    setNewLat(result.lat);
    setNewLng(result.lng);
    setNewProvince(result.province);
    setNewCity(result.city);
    setNewStreet(result.street);
    setNewPostalCode(result.postalCode);
  };

  const fetchItems = async () => {
    const res = await fetch(cfg.apiBase);
    if (res.ok) {
      const body = await res.json();
      const list = (body[cfg.listKey] as Record<string, unknown>[]) ?? [];
      setItems(
        list.map((r) => ({
          id: r.id as string,
          value: r[cfg.valueField] as string,
          label: (r.label as string | null) ?? null,
          isDefault: r.isDefault as boolean,
        })),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectDefault = async (id: string) => {
    const prev = items;
    setItems((p) => p.map((it) => ({ ...it, isDefault: it.id === id })));
    const res = await fetch(`${cfg.apiBase}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (!res.ok) {
      setItems(prev);
      showToast("خطا در انتخاب مورد پیش‌فرض.", "error");
    }
  };

  const deleteItem = async (id: string) => {
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== id));
    const res = await fetch(`${cfg.apiBase}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prev);
      showToast("خطا در حذف.", "error");
      return;
    }
    // A deleted default gets a new one promoted server-side — refetch so
    // the list reflects whichever item is now the default.
    fetchItems();
  };

  // Joins whichever structured fields are actually filled in into the one
  // "address" string every other reader in the app (PDFs, admin, sync)
  // still just displays as plain text — see the schema comment on
  // UserAddress.address.
  const composeAddress = () => {
    const parts = [newProvince.trim(), newCity.trim(), newStreet.trim(), newPlaque.trim() ? `پلاک ${newPlaque.trim()}` : ""].filter(Boolean);
    let composed = parts.join("، ");
    if (newPostalCode.trim()) composed += `${composed ? " — " : ""}کدپستی ${newPostalCode.trim()}`;
    return composed;
  };

  const addNew = async () => {
    let value: string;
    let extraFields: Record<string, unknown> = {};

    if (kind === "address") {
      value = composeAddress();
      if (!value) {
        showToast("حداقل یکی از فیلدهای آدرس را پر کنید.", "error");
        return;
      }
      extraFields = {
        province: newProvince.trim() || undefined,
        city: newCity.trim() || undefined,
        street: newStreet.trim() || undefined,
        plaque: newPlaque.trim() || undefined,
        postalCode: newPostalCode.trim() || undefined,
        lat: newLat ?? undefined,
        lng: newLng ?? undefined,
      };
    } else {
      value = newValue.trim();
      if (!value) return;
      if (!isValidIranPhone(value)) {
        showToast("شماره تماس معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹", "error");
        return;
      }
    }

    setSaving(true);
    const res = await fetch(cfg.apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [cfg.valueField]: value, label: newLabel.trim() || undefined, ...extraFields }),
    });
    setSaving(false);

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      showToast(errBody?.error || "خطا در ثبت.", "error");
      return;
    }

    resetAddForm();
    setAdding(false);
    fetchItems();
  };

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-foreground/80">{cfg.title}</p>

      {loading ? (
        <p className="text-xs text-foreground/40">در حال بارگذاری...</p>
      ) : (
        <>
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  role="radio"
                  aria-checked={item.isDefault}
                  tabIndex={0}
                  onClick={() => !item.isDefault && selectDefault(item.id)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !item.isDefault) {
                      e.preventDefault();
                      selectDefault(item.id);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    item.isDefault ? "border-accent-500/50 bg-accent-500/5" : "border-foreground/10 hover:border-foreground/20",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      item.isDefault ? "border-accent-500 bg-accent-500 text-primary-foreground" : "border-foreground/20",
                    )}
                  >
                    {item.isDefault && <Check className="size-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {item.label && <p className="text-xs font-semibold text-foreground/50">{item.label}</p>}
                    <p className={cn("text-sm text-foreground", kind === "address" && "whitespace-pre-wrap")} dir={kind === "phone" ? "ltr" : undefined}>
                      {item.value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    aria-label="حذف"
                    className="shrink-0 rounded-full p-1 text-foreground/30 transition-colors hover:bg-foreground/10 hover:text-red-400"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && !adding && <p className="text-xs text-foreground/40">{cfg.emptyText}</p>}

          {adding ? (
            <div className="space-y-2 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3">
              {kind === "address" ? (
                <>
                  <AddressMapPicker onLocate={applyLocate} />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newProvince} onChange={(e) => setNewProvince(e.target.value)} placeholder="استان" className={inputClass} />
                    <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="شهر" className={inputClass} />
                  </div>
                  <input
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="خیابان/کوچه"
                    className={inputClass}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newPlaque} onChange={(e) => setNewPlaque(e.target.value)} placeholder="پلاک" className={inputClass} />
                    <input
                      dir="ltr"
                      value={newPostalCode}
                      onChange={(e) => setNewPostalCode(e.target.value)}
                      placeholder="کدپستی"
                      className={inputClass}
                    />
                  </div>
                </>
              ) : (
                <input
                  dir="ltr"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={cfg.placeholder}
                  className={inputClass}
                />
              )}
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="برچسب (اختیاری) — مثلاً خانه یا محل کار"
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addNew}
                  disabled={saving}
                  className="rounded-full bg-accent-500 px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    resetAddForm();
                  }}
                  className="rounded-full border border-foreground/10 px-4 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/20"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent-400 transition-colors hover:text-accent-300"
            >
              <Plus className="size-3.5" />
              {cfg.addLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
