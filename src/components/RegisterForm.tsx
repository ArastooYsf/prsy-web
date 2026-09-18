"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Building2, User as UserIcon } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import RegisterStepper from "@/components/RegisterStepper";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import NationalIdInquiryField from "@/components/NationalIdInquiryField";
import { useToast } from "@/components/ToastProvider";
import { isValidEmail, isValidUsername } from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";
const inputErrorClass = "border-red-500/60 focus:border-red-500/60";

type CustomerType = "INDIVIDUAL" | "LEGAL";
type FieldErrors = Record<string, string>;

// Small helper so every field renders the same way: the normal label, or —
// in its place — the validation error in red, per the "error text above the
// field" spec. Never both at once, so a failed field doesn't grow taller
// than a valid one and shove the rest of the step down.
function FieldLabel({ htmlFor, label, error }: { htmlFor: string; label: string; error?: string }) {
  return (
    <label htmlFor={htmlFor} className={`mb-1.5 block text-sm font-medium ${error ? "text-red-400" : "text-foreground/80"}`}>
      {error || label}
    </label>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [customerType, setCustomerType] = useState<CustomerType>("INDIVIDUAL");

  // Step 2
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [nationalId, setNationalId] = useState("");

  // Step 3
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const freshTokenResolveRef = useRef<((token: string) => void) | null>(null);

  function getFreshTurnstileToken(): Promise<string> {
    return new Promise((resolve) => {
      freshTokenResolveRef.current = resolve;
      setTurnstileToken("");
      setTurnstileKey((k) => k + 1);
    });
  }

  const selectCustomerType = (type: CustomerType) => {
    setCustomerType(type);
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "نام و نام خانوادگی الزامی است.";
    if (username.trim() && !isValidUsername(username.trim())) {
      errors.username = "نام کاربری باید ۳ تا ۳۰ کاراکتر انگلیسی/عدد/_ باشد.";
    }
    if (customerType === "LEGAL") {
      if (!companyName.trim()) errors.companyName = "نام شرکت الزامی است.";
      if (!nationalId.trim()) errors.nationalId = "شناسه ملی الزامی است.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: FieldErrors = {};
    if (!isValidEmail(email)) errors.email = "ایمیل معتبر نیست.";
    if (password.length < 8) errors.password = "رمز عبور باید حداقل ۸ کاراکتر باشد.";
    else if (password !== confirmPassword) errors.confirmPassword = "رمز عبور و تکرار آن یکسان نیستند.";
    if (!acceptedTerms) errors.terms = "برای ثبت‌نام باید قوانین و مقررات را بپذیرید.";
    if (!turnstileToken) errors.turnstile = "لطفاً تأیید کنید که ربات نیستید.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        username: username.trim() || undefined,
        email,
        password,
        customerType,
        companyName,
        nationalId,
        turnstileToken,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ثبت‌نام.", "error");
      setLoading(false);
      setTurnstileToken("");
      setTurnstileKey((k) => k + 1);
      return;
    }

    const freshToken = await getFreshTurnstileToken();
    const result = await signIn("credentials", { email, password, turnstileToken: freshToken, redirect: false });

    setLoading(false);

    if (!result || result.error) {
      router.push("/login");
      return;
    }

    router.push("/account");
    router.refresh();
  };

  return (
    <div>
      <RegisterStepper currentStep={step} />

      {step === 1 && (
        <div>
          <p className="mb-3 text-sm font-medium text-foreground/80">نوع حساب کاربری خود را انتخاب کنید</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => selectCustomerType("INDIVIDUAL")}
              className={`flex flex-col items-center gap-2.5 rounded-xl border px-4 py-6 transition-colors ${
                customerType === "INDIVIDUAL"
                  ? "border-accent-500/50 bg-accent-500/10 text-accent-400"
                  : "border-foreground/10 text-foreground/70 hover:border-accent-500/30"
              }`}
            >
              <UserIcon className="size-7" />
              <span className="text-sm font-semibold">حقیقی</span>
            </button>
            <button
              type="button"
              onClick={() => selectCustomerType("LEGAL")}
              className={`flex flex-col items-center gap-2.5 rounded-xl border px-4 py-6 transition-colors ${
                customerType === "LEGAL"
                  ? "border-accent-500/50 bg-accent-500/10 text-accent-400"
                  : "border-foreground/10 text-foreground/70 hover:border-accent-500/30"
              }`}
            >
              <Building2 className="size-7" />
              <span className="text-sm font-semibold">حقوقی</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2Submit} noValidate className="space-y-4">
          <div>
            <FieldLabel htmlFor="name" label="نام و نام خانوادگی" error={fieldErrors.name} />
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} ${fieldErrors.name ? inputErrorClass : ""}`}
              placeholder="نام شما"
            />
          </div>

          <div>
            <FieldLabel htmlFor="username" label="نام کاربری (اختیاری)" error={fieldErrors.username} />
            <input
              id="username"
              name="username"
              type="text"
              dir="ltr"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${inputClass} ${fieldErrors.username ? inputErrorClass : ""}`}
              placeholder="username"
            />
          </div>

          {customerType === "LEGAL" && (
            <>
              <div>
                <FieldLabel htmlFor="companyName" label="نام شرکت" error={fieldErrors.companyName} />
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={`${inputClass} ${fieldErrors.companyName ? inputErrorClass : ""}`}
                  placeholder="نام ثبت‌شده شرکت"
                />
              </div>
              <NationalIdInquiryField
                value={nationalId}
                onChange={setNationalId}
                error={fieldErrors.nationalId}
              />
              <p className="rounded-lg border border-accent-500/20 bg-accent-500/5 px-4 py-2.5 text-xs leading-6 text-foreground/60">
                شناسه ملی به‌صورت خودکار استعلام می‌شود. اگر استعلام موفق نبود هم می‌توانید ثبت‌نام را ادامه دهید — در
                صورت نیاز، بعداً بررسی خواهد شد.
              </p>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-foreground/10 px-5 py-3 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20"
            >
              بازگشت
            </button>
            <button
              type="submit"
              className="flex-1 rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
            >
              بعدی
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleFinalSubmit} noValidate className="space-y-4">
          <div>
            <FieldLabel htmlFor="email" label="ایمیل" error={fieldErrors.email} />
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} ${fieldErrors.email ? inputErrorClass : ""}`}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <FieldLabel htmlFor="password" label="رمز عبور" error={fieldErrors.password} />
            <input
              id="password"
              name="password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} ${fieldErrors.password ? inputErrorClass : ""}`}
              placeholder="حداقل ۸ کاراکتر"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <div>
            <FieldLabel htmlFor="confirmPassword" label="تکرار رمز عبور" error={fieldErrors.confirmPassword} />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClass} ${fieldErrors.confirmPassword ? inputErrorClass : ""}`}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="flex items-start gap-2.5 text-sm text-foreground/70">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-foreground/20 bg-foreground/5"
                style={{ accentColor: "#f97316" }}
              />
              <span>
                <Link href="/terms" target="_blank" className="font-medium text-accent-400 transition-colors hover:text-foreground">
                  قوانین و مقررات
                </Link>{" "}
                را می‌پذیرم
              </span>
            </label>
            {fieldErrors.terms && <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.terms}</p>}
          </div>

          <div>
            <TurnstileWidget
              key={turnstileKey}
              onVerify={(token) => {
                setTurnstileToken(token);
                freshTokenResolveRef.current?.(token);
                freshTokenResolveRef.current = null;
              }}
              onExpire={() => setTurnstileToken("")}
            />
            {fieldErrors.turnstile && <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.turnstile}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-foreground/10 px-5 py-3 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20"
            >
              بازگشت
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
