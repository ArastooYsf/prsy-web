import { Bell } from "lucide-react";

const NOTIFICATION_OPTIONS = [
  { label: "ایمیل هنگام پاسخ به تیکت" },
  { label: "ایمیل هنگام تغییر وضعیت سفارش" },
  { label: "ایمیل هنگام نزدیک شدن به انقضای قرارداد" },
  { label: "پیامک برای رویدادهای مهم حساب" },
];

// Backend for notification delivery doesn't exist yet — this is a disabled
// preview of the settings UI so the layout/expectation is visible; wiring it
// up needs a notification-preferences table/column plus an actual email/SMS
// sender, neither of which exist in this project yet.
export default function NotificationSettingsPreview() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-foreground/50" />
        <h3 className="text-base font-bold">تنظیمات اعلان</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-foreground/50">
          به‌زودی
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground/50">
        سیستم اعلان‌رسانی این پروژه هنوز پیاده‌سازی نشده؛ گزینه‌های زیر فقط پیش‌نمایش هستند و غیرفعال‌اند.
      </p>

      <div className="mt-5 space-y-3 opacity-50">
        {NOTIFICATION_OPTIONS.map((opt) => (
          <label key={opt.label} className="flex cursor-not-allowed items-center justify-between gap-3 text-sm">
            <span>{opt.label}</span>
            <span
              dir="ltr"
              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-white/15"
              aria-disabled="true"
            >
              <span className="inline-block size-3.5 translate-x-[4px] rounded-full bg-white shadow-sm" />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
