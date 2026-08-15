import { Bell } from "lucide-react";

const NOTIFICATION_OPTIONS = [
  { label: "ایمیل هنگام پاسخ به تیکت" },
  { label: "ایمیل هنگام تغییر وضعیت سفارش" },
  { label: "ایمیل هنگام نزدیک شدن به انقضای قرارداد" },
  { label: "پیامک برای رویدادهای مهم حساب" },
];

// Delivery itself (email/SMS/in-app bell) is live for all four events below —
// see src/lib/notifications/. What's still missing is per-user opt-out: there's
// no preferences table yet, so every customer currently receives all of them
// and these toggles stay disabled until that's built.
export default function NotificationSettingsPreview() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-foreground/50" />
        <h3 className="text-base font-bold">تنظیمات اعلان</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-foreground/50">
          به‌زودی قابل تنظیم
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground/50">
        این اعلان‌ها هم‌اکنون برای همه فعال هستند؛ امکان خاموش/روشن کردن جداگانه هر مورد به‌زودی اضافه می‌شود.
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
