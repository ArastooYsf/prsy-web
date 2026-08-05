"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "LEGAL">("INDIVIDUAL");
  const [companyName, setCompanyName] = useState("");
  const [economicCode, setEconomicCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApprovalMessage, setPendingApprovalMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }
    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }
    if (customerType === "LEGAL" && (!companyName.trim() || !economicCode.trim())) {
      setError("نام شرکت و کد اقتصادی برای مشتری حقوقی الزامی است.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, customerType, companyName, economicCode }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در ثبت‌نام.");
      setLoading(false);
      return;
    }

    const data = await res.json().catch(() => null);

    if (data?.pendingApproval) {
      setLoading(false);
      setPendingApprovalMessage(true);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);

    if (!result || result.error) {
      router.push("/login");
      return;
    }

    router.push("/account");
    router.refresh();
  };

  if (pendingApprovalMessage) {
    return (
      <div className="rounded-lg border border-accent-500/30 bg-accent-500/10 px-4 py-4 text-sm leading-7 text-foreground/80">
        ثبت‌نام حساب حقوقی شما با موفقیت انجام شد. حساب شما پس از بررسی و تأیید توسط تیم پشتیبانی فعال خواهد شد و
        می‌توانید پس از آن وارد شوید.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground/80">
          نام
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="نام شما"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground/80">
          ایمیل
        </label>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/80">
          رمز عبور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="حداقل ۸ کاراکتر"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-foreground/80">
          تکرار رمز عبور
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          dir="ltr"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
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
        <>
          <div>
            <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-foreground/80">
              نام شرکت
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={inputClass}
              placeholder="نام ثبت‌شده شرکت"
            />
          </div>
          <div>
            <label htmlFor="economicCode" className="mb-1.5 block text-sm font-medium text-foreground/80">
              کد اقتصادی / شناسه ملی
            </label>
            <input
              id="economicCode"
              name="economicCode"
              type="text"
              dir="ltr"
              required
              value={economicCode}
              onChange={(e) => setEconomicCode(e.target.value)}
              className={inputClass}
              placeholder="مثلاً 14005678901"
            />
          </div>
          <p className="rounded-lg border border-accent-500/20 bg-accent-500/5 px-4 py-2.5 text-xs leading-6 text-foreground/60">
            حساب‌های حقوقی پس از ثبت‌نام، قبل از فعال شدن باید توسط تیم پشتیبانی بررسی و تأیید شوند.
          </p>
        </>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
      </button>
    </form>
  );
}
