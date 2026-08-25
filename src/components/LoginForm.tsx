"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { useToast } from "@/components/ToastProvider";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitCallbackUrl = searchParams.get("callbackUrl");
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const freshTokenResolveRef = useRef<((token: string) => void) | null>(null);

  // Turnstile tokens are single-use. The credentials-only attempt already
  // consumes one, so the follow-up 2FA submission needs a freshly solved one
  // — remounting the widget triggers a new (near-instant) solve.
  function getFreshTurnstileToken(): Promise<string> {
    return new Promise((resolve) => {
      freshTokenResolveRef.current = resolve;
      setTurnstileToken("");
      setTurnstileKey((k) => k + 1);
    });
  }

  function describeError(code: string | null | undefined): string {
    switch (code) {
      case "PENDING_APPROVAL":
        return "حساب حقوقی شما هنوز توسط تیم پشتیبانی تأیید نشده است.";
      case "REJECTED":
        return "درخواست حساب شما تأیید نشد. برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.";
      case "ACCOUNT_LOCKED":
        return "حساب موقتاً قفل شده، ۱۵ دقیقه دیگر تلاش کنید.";
      case "TOO_MANY_REQUESTS":
        return "تعداد تلاش‌های شما بیش از حد مجاز است. کمی بعد دوباره امتحان کنید.";
      case "TURNSTILE_FAILED":
        return "تأیید ربات‌نبودن ناموفق بود، دوباره تلاش کنید.";
      case "TOTP_INVALID":
        return "کد وارد شده نادرست است.";
      default:
        return "ایمیل یا رمز عبور نادرست است.";
    }
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      showToast("لطفاً تأیید کنید که ربات نیستید.", "error");
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", { email, password, turnstileToken, redirect: false });
    setLoading(false);

    if (!result || result.error) {
      if (result?.error === "TOTP_REQUIRED") {
        setStep("totp");
        setTurnstileToken("");
        setTurnstileKey((k) => k + 1);
        return;
      }
      showToast(describeError(result?.error), "error");
      setTurnstileToken("");
      setTurnstileKey((k) => k + 1);
      return;
    }

    router.push(explicitCallbackUrl || "/account");
    router.refresh();
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const freshToken = await getFreshTurnstileToken();
    const result = await signIn("credentials", { email, password, turnstileToken: freshToken, totpCode, redirect: false });
    setLoading(false);

    if (!result || result.error) {
      showToast(describeError(result?.error), "error");
      setTotpCode("");
      if (result?.error === "ACCOUNT_LOCKED" || result?.error === "TOO_MANY_REQUESTS") {
        setStep("credentials");
      }
      return;
    }

    router.push(explicitCallbackUrl || "/account");
    router.refresh();
  };

  if (step === "totp") {
    return (
      <form onSubmit={handleTotpSubmit} className="space-y-4">
        <p className="text-sm leading-6 text-foreground/60">
          کد ۶ رقمی اپلیکیشن احراز هویت (Authenticator) خود را وارد کنید.
        </p>

        <div>
          <label htmlFor="totpCode" className="mb-1.5 block text-sm font-medium text-foreground/80">
            کد دومرحله‌ای
          </label>
          <input
            id="totpCode"
            name="totpCode"
            type="text"
            inputMode="numeric"
            dir="ltr"
            autoComplete="one-time-code"
            required
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${inputClass} text-center tracking-[0.5em]`}
            placeholder="------"
          />
        </div>

        <TurnstileWidget
          key={turnstileKey}
          onVerify={(token) => {
            setTurnstileToken(token);
            freshTokenResolveRef.current?.(token);
            freshTokenResolveRef.current = null;
          }}
          onExpire={() => setTurnstileToken("")}
        />

        <button
          type="submit"
          disabled={loading || totpCode.length !== 6}
          className="mt-2 w-full rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "در حال بررسی..." : "تأیید کد"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setTotpCode("");
          }}
          className="w-full text-center text-xs font-medium text-foreground/50 hover:text-foreground"
        >
          بازگشت
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      <TurnstileWidget key={turnstileKey} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

      <button
        type="submit"
        disabled={loading || !turnstileToken}
        className="mt-2 w-full rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "در حال ورود..." : "ورود"}
      </button>
    </form>
  );
}
