"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { isValidEmail, isValidIranPhone } from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type CustomerFormProps = {
  submitLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
};

export default function CustomerForm({ submitLabel, notesLabel, notesPlaceholder }: CustomerFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "LEGAL">("INDIVIDUAL");
  const [companyName, setCompanyName] = useState("");
  const [economicCode, setEconomicCode] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const generatePassword = () => {
    setPassword(Math.random().toString(36).slice(-10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email) || password.length < 8) {
      showToast("ایمیل معتبر الزامی و رمز عبور باید حداقل ۸ کاراکتر باشد.", "error");
      return;
    }
    if (phone.trim() && !isValidIranPhone(phone)) {
      showToast("شماره تلفن معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹", "error");
      return;
    }
    if (customerType === "LEGAL" && (!companyName.trim() || !economicCode.trim())) {
      showToast("نام شرکت و کد اقتصادی برای مشتری حقوقی الزامی است.", "error");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, customerType, companyName, economicCode, notes }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ثبت مشتری.", "error");
      return;
    }

    showToast("مشتری با موفقیت ثبت شد.");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setCompanyName("");
    setEconomicCode("");
    setNotes("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">تلفن</label>
          <input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">ایمیل</label>
        <input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">رمز عبور اولیه</label>
        <div className="flex gap-2">
          <input
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="حداقل ۸ کاراکتر"
          />
          <button
            type="button"
            onClick={generatePassword}
            className="shrink-0 rounded-lg border border-white/10 px-4 py-3 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            تولید خودکار
          </button>
        </div>
        <p className="mt-1.5 text-xs text-foreground/40">این رمز را باید خودتان به مشتری اطلاع دهید.</p>
      </div>

      <div>
        <p className="mb-1.5 block text-sm font-medium text-foreground/80">نوع مشتری</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCustomerType("INDIVIDUAL")}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              customerType === "INDIVIDUAL"
                ? "border-accent-500/50 bg-accent-500/10 text-accent-400"
                : "border-white/10 text-foreground/60 hover:border-white/20"
            }`}
          >
            حقیقی
          </button>
          <button
            type="button"
            onClick={() => setCustomerType("LEGAL")}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              customerType === "LEGAL"
                ? "border-accent-500/50 bg-accent-500/10 text-accent-400"
                : "border-white/10 text-foreground/60 hover:border-white/20"
            }`}
          >
            حقوقی
          </button>
        </div>
      </div>

      {customerType === "LEGAL" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام شرکت</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">کد اقتصادی / شناسه ملی</label>
            <input dir="ltr" value={economicCode} onChange={(e) => setEconomicCode(e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">{notesLabel}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder={notesPlaceholder}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : submitLabel}
      </button>
    </form>
  );
}
