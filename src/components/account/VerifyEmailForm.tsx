"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MailCheck } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { toPersianDigits } from "@/lib/format-number";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailForm({ targetEmail, isChange }: { targetEmail: string; isChange: boolean }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && cooldownTimer.current) {
          clearInterval(cooldownTimer.current);
          cooldownTimer.current = null;
        }
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      showToast("کد باید ۶ رقم باشد.", "error");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/account/email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.error ?? "تأیید کد با خطا مواجه شد.", "error");
        setVerifying(false);
        return;
      }
      showToast("ایمیل با موفقیت تأیید شد.", "success");
      await updateSession();
      router.push("/account");
      router.refresh();
    } catch {
      showToast("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", "error");
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/account/email/request", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.error ?? "ارسال دوباره‌ی کد با خطا مواجه شد.", "error");
        setResending(false);
        return;
      }
      showToast("کد جدید ارسال شد.", "success");
      startCooldown();
    } catch {
      showToast("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 text-center sm:p-8">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-500/10 text-accent-500">
        <MailCheck className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-bold">{isChange ? "تأیید ایمیل جدید" : "تأیید ایمیل حساب"}</h2>
      <p className="mt-2 text-sm leading-7 text-foreground/60">
        کدی ۶ رقمی به آدرس
        <span dir="ltr" className="mx-1 font-semibold text-foreground">
          {targetEmail}
        </span>
        ارسال شد. آن را در کادر زیر وارد کنید.
      </p>

      <form onSubmit={handleVerify} className="mt-6">
        <input
          dir="ltr"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="------"
          className="w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-foreground outline-none transition-colors focus:border-accent-500/50"
        />

        <button
          type="submit"
          disabled={verifying}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verifying ? "در حال بررسی..." : "تأیید کد"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || cooldown > 0}
        className="mt-4 text-xs font-medium text-accent-500 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-foreground/40 disabled:no-underline"
      >
        {cooldown > 0 ? `ارسال دوباره‌ی کد (${toPersianDigits(cooldown)} ثانیه)` : "ارسال دوباره‌ی کد"}
      </button>
    </div>
  );
}
