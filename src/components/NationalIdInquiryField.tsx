"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

// Shape of the `company` object POST /api/legal-entity/inquire returns on
// success — already interpreted server-side (src/lib/national-id-verification.ts),
// not the raw api.ir envelope.
export type InquiredCompany = {
  name: string | null;
  companyType: string | null;
  active: boolean | null;
  /** true when found but not currently active (dissolved) — see `warning` for the message. */
  dissolved: boolean;
  warning: string | null;
  address: string | null;
  postalCode: string | null;
  province: string | null;
  city: string | null;
};

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";
const inputErrorClass = "border-red-500/60 focus:border-red-500/60";

type InquiryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; company: InquiredCompany }
  | { status: "warning"; company: InquiredCompany }
  | { status: "error"; message: string };

type NationalIdInquiryFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Field-level validation error from the parent form (e.g. "required") — shown instead of the label, same convention as the rest of these forms. */
  error?: string;
  disabled?: boolean;
  /** Fires once per successful lookup (active or dissolved) — e.g. ProfileForm uses it to offer filling the address field from the registry. Never fires on a failed inquiry. */
  onVerified?: (company: InquiredCompany) => void;
};

// Shared by RegisterForm, ProfileForm, and the admin CustomerForm — the
// only thing that ever calls POST /api/legal-entity/inquire from the
// browser. A failed or skipped inquiry here never blocks the surrounding
// form: it's a preview only, the actual save (register/profile/admin
// customer route) independently re-verifies server-side and persists
// whatever THAT check finds — never what this component reports, since a
// client can't be trusted to report its own inquiry honestly.
export default function NationalIdInquiryField({ value, onChange, error, disabled, onVerified }: NationalIdInquiryFieldProps) {
  const [state, setState] = useState<InquiryState>({ status: "idle" });
  // Avoids re-querying (and re-billing) the same value the field was last
  // checked against — e.g. tabbing through the field on blur without
  // having typed anything new, or clicking "استعلام" twice in a row.
  const lastCheckedRef = useRef<string | null>(null);

  const runInquiry = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === lastCheckedRef.current) return;

    lastCheckedRef.current = trimmed;
    setState({ status: "loading" });

    let res: Response;
    try {
      res = await fetch("/api/legal-entity/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId: trimmed }),
      });
    } catch {
      setState({ status: "error", message: "سرویس استعلام موقتاً در دسترس نیست، لطفاً بعداً تلاش کنید یا با پشتیبانی تماس بگیرید." });
      return;
    }

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.company) {
      setState({ status: "error", message: body?.error || "استعلام ناموفق بود." });
      return;
    }

    const company = body.company as InquiredCompany;
    onVerified?.(company);
    setState(company.dissolved ? { status: "warning", company } : { status: "success", company });
  };

  return (
    <div>
      <label className={`mb-1.5 block text-sm font-medium ${error ? "text-red-400" : "text-foreground/80"}`}>
        {error || "شناسه ملی"}
      </label>
      <div className="flex gap-2">
        <input
          dir="ltr"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            if (state.status !== "idle") setState({ status: "idle" });
          }}
          onBlur={runInquiry}
          className={`${inputClass} ${error ? inputErrorClass : ""}`}
          placeholder="۱۱ رقمی، مثلاً 14007650912"
        />
        <button
          type="button"
          disabled={disabled || state.status === "loading" || !value.trim()}
          onClick={runInquiry}
          className="shrink-0 rounded-lg border border-accent-500/40 px-4 text-sm font-semibold text-accent-400 transition-colors hover:bg-accent-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : "استعلام"}
        </button>
      </div>

      {state.status === "success" && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs leading-6 text-emerald-400">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="font-semibold">{state.company.name || "نام یافت نشد"}</strong>
            {state.company.companyType && <> — {state.company.companyType}</>} — وضعیت: فعال
          </span>
        </div>
      )}

      {state.status === "warning" && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-6 text-amber-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="font-semibold">{state.company.name || "نام یافت نشد"}</strong> پیدا شد، اما {state.company.warning}
            {" "}می‌توانید ادامه دهید؛ این مورد برای بررسی دستی به مدیر سیستم نشان داده می‌شود.
          </span>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs leading-6 text-red-400">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.message} می‌توانید بدون این تأیید هم ادامه دهید؛ بعداً بررسی می‌شود.</span>
        </div>
      )}
    </div>
  );
}
