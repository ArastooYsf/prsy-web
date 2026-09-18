"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export type NotificationPreferences = {
  notifyEmail: boolean;
  notifySms: boolean;
  notifyTicketReply: boolean;
  notifyOrderStatus: boolean;
  notifyContractExpiry: boolean;
  notifyStaffNewMessage: boolean;
};

type NotificationSettingsProps = {
  role: string;
  initial: NotificationPreferences;
};

const CHANNEL_OPTIONS: { key: "notifyEmail" | "notifySms"; label: string }[] = [
  { key: "notifyEmail", label: "دریافت اعلان از طریق ایمیل" },
  { key: "notifySms", label: "دریافت اعلان از طریق پیامک (در صورت ثبت شماره تماس)" },
];

// Per-role event list — CUSTOMER accounts don't manage staff notifications
// and ADMIN/SUPPORT accounts don't have their own orders/contracts, so each
// role only sees the events that can actually happen to them (matches the
// role-scoped notify* functions in src/lib/notifications/events.ts).
const CUSTOMER_EVENTS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "notifyTicketReply", label: "پاسخ جدید به تیکت پشتیبانی" },
  { key: "notifyOrderStatus", label: "تغییر وضعیت سفارش" },
  { key: "notifyContractExpiry", label: "نزدیک شدن به انقضای قرارداد" },
];

const STAFF_EVENTS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "notifyStaffNewMessage", label: "ثبت پیام جدید مشتری در یک تیکت" },
];

// The visual pill (h-5 w-9) is intentionally smaller than the 44px minimum
// touch target — the button itself is sized to 44x44 and centers the pill,
// so the tappable area meets the project's touch-target rule without
// inflating the pill's own visual size.
function Toggle({ checked, disabled, onClick }: { checked: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span
        aria-hidden
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-accent-500" : "bg-foreground/15"
        }`}
      >
        <span
          dir="ltr"
          className={`inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[4px]"
          }`}
        />
      </span>
    </button>
  );
}

export default function NotificationSettings({ role, initial }: NotificationSettingsProps) {
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState(initial);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const events = role === "CUSTOMER" ? CUSTOMER_EVENTS : STAFF_EVENTS;

  const toggle = async (key: keyof NotificationPreferences) => {
    const nextValue = !prefs[key];
    const prevPrefs = prefs;
    setPrefs((p) => ({ ...p, [key]: nextValue }));
    setSavingKey(key);

    let res: Response;
    try {
      res = await fetch("/api/account/notification-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextValue }),
      });
    } catch {
      setSavingKey(null);
      setPrefs(prevPrefs);
      showToast("اتصال برقرار نشد. دوباره تلاش کنید.", "error");
      return;
    }

    setSavingKey(null);

    if (!res.ok) {
      setPrefs(prevPrefs);
      showToast("خطا در ذخیره تنظیمات.", "error");
    }
  };

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-foreground/50" />
        <h3 className="text-base font-bold">تنظیمات اعلان</h3>
      </div>
      <p className="mt-2 text-sm text-foreground/50">
        مشخص کنید کدام اعلان‌ها و از چه طریقی برای شما ارسال شود. اعلان داخل‌سایت (زنگوله بالای صفحه) همیشه فعال
        است و قابل خاموش‌کردن نیست.
      </p>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold text-foreground/40">روش دریافت</p>
        <div className="space-y-3">
          {CHANNEL_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-center justify-between gap-3 text-sm">
              <span>{opt.label}</span>
              <Toggle checked={prefs[opt.key]} disabled={savingKey === opt.key} onClick={() => toggle(opt.key)} />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-foreground/10 pt-5">
        <p className="mb-2 text-xs font-semibold text-foreground/40">اطلاع‌رسانی برای</p>
        <div className="space-y-3">
          {events.map((opt) => (
            <label key={opt.key} className="flex items-center justify-between gap-3 text-sm">
              <span>{opt.label}</span>
              <Toggle checked={prefs[opt.key]} disabled={savingKey === opt.key} onClick={() => toggle(opt.key)} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
