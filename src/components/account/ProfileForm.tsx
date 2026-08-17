"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarUploader from "@/components/account/AvatarUploader";
import { isValidEmail, isValidIranPhone } from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type ProfileFormProps = {
  role: string;
  customerType: string | null;
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialAlternatePhone: string;
  initialAddress: string;
  initialAvatarUrl: string;
  initialCompanyName: string;
  initialEconomicCode: string;
};

export default function ProfileForm({
  role,
  customerType,
  initialName,
  initialPhone,
  initialEmail,
  initialAlternatePhone,
  initialAddress,
  initialAvatarUrl,
  initialCompanyName,
  initialEconomicCode,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [alternatePhone, setAlternatePhone] = useState(initialAlternatePhone);
  const [address, setAddress] = useState(initialAddress);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [economicCode, setEconomicCode] = useState(initialEconomicCode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const isCustomer = role === "CUSTOMER";
  const isLegalCustomer = isCustomer && customerType === "LEGAL";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!isValidEmail(email)) {
      setError("ایمیل معتبر نیست.");
      return;
    }
    if (phone && !isValidIranPhone(phone)) {
      setError("شماره تماس معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹");
      return;
    }
    if (alternatePhone && !isValidIranPhone(alternatePhone)) {
      setError("شماره تماس جایگزین معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, alternatePhone, address, avatarUrl, companyName, economicCode }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در بروزرسانی اطلاعات.");
      return;
    }

    setSuccess(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h3 className="text-base font-bold">اطلاعات شخصی</h3>

      <AvatarUploader value={avatarUrl} onChange={setAvatarUrl} nameForAlt={name || email} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام و نام خانوادگی</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">شماره تماس</label>
          <input
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          />
        </div>

        <div className={isCustomer ? "" : "sm:col-span-2"}>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">ایمیل</label>
          <input
            dir="ltr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        {isCustomer && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">شماره تماس جایگزین</label>
            <input
              dir="ltr"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              className={inputClass}
              placeholder="اختیاری"
            />
          </div>
        )}
      </div>

      {isCustomer && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">آدرس</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="آدرس پستی برای ارسال سفارش‌ها و مکاتبات"
          />
        </div>
      )}

      {isLegalCustomer && (
        <div className="grid grid-cols-1 gap-5 border-t border-white/10 pt-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام شرکت</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">کد اقتصادی</label>
            <input
              dir="ltr"
              value={economicCode}
              onChange={(e) => setEconomicCode(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
          اطلاعات با موفقیت ذخیره شد.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </form>
  );
}
