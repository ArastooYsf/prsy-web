"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

const codeInputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.5em] text-foreground outline-none transition-colors focus:border-accent-500/50";

type SetupState = { secret: string; qrCodeDataUrl: string } | null;

export default function TwoFactorSetup({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setup, setSetup] = useState<SetupState>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  async function startSetup() {
    setLoading(true);
    const res = await fetch("/api/account/2fa/setup", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      showToast("خطا در آغاز فعال‌سازی.", "error");
      return;
    }
    setSetup(await res.json());
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!setup) return;
    setLoading(true);
    const res = await fetch("/api/account/2fa/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: setup.secret, code }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "کد وارد شده نادرست است.", "error");
      return;
    }
    setEnabled(true);
    setSetup(null);
    setCode("");
    showToast("احراز هویت دومرحله‌ای فعال شد.");
    router.refresh();
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/account/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "کد وارد شده نادرست است.", "error");
      return;
    }
    setEnabled(false);
    setShowDisable(false);
    setCode("");
    showToast("احراز هویت دومرحله‌ای غیرفعال شد.");
    router.refresh();
  }

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold">احراز هویت دومرحله‌ای</h3>
        {enabled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="size-3.5" />
            فعال
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-foreground/50">
            <ShieldOff className="size-3.5" />
            غیرفعال
          </span>
        )}
      </div>

      <p className="text-sm leading-6 text-foreground/60">
        با فعال‌سازی این گزینه، علاوه بر رمز عبور، هنگام ورود یک کد ۶ رقمی از اپلیکیشن احراز هویت (مثل Google
        Authenticator یا Authy) هم لازم خواهد بود.
      </p>

      {!enabled && !setup && (
        <button
          type="button"
          onClick={startSetup}
          disabled={loading}
          className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "در حال آماده‌سازی..." : "فعال‌سازی احراز هویت دومرحله‌ای"}
        </button>
      )}

      {!enabled && setup && (
        <form onSubmit={confirmSetup} className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrCodeDataUrl} alt="QR کد احراز هویت دومرحله‌ای" className="size-44 rounded-lg bg-white p-2" />
            <p dir="ltr" className="break-all text-center text-xs text-foreground/50">
              {setup.secret}
            </p>
            <p className="text-center text-xs text-foreground/50">
              کد بالا را با اپلیکیشن Authenticator اسکن کنید یا دستی وارد کنید.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">کد ۶ رقمی تأیید</label>
            <input
              dir="ltr"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={codeInputClass}
              placeholder="------"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "در حال بررسی..." : "تأیید و فعال‌سازی"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSetup(null);
                setCode("");
              }}
              className="rounded-full border border-white/15 px-7 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {enabled && !showDisable && (
        <button
          type="button"
          onClick={() => setShowDisable(true)}
          className="rounded-full border border-red-500/30 px-7 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
        >
          غیرفعال‌سازی
        </button>
      )}

      {enabled && showDisable && (
        <form onSubmit={disable} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              برای غیرفعال‌سازی، کد ۶ رقمی فعلی را وارد کنید
            </label>
            <input
              dir="ltr"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={codeInputClass}
              placeholder="------"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="rounded-full border border-red-500/30 px-7 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "در حال بررسی..." : "تأیید غیرفعال‌سازی"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDisable(false);
                setCode("");
              }}
              className="rounded-full border border-white/15 px-7 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
            >
              انصراف
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
