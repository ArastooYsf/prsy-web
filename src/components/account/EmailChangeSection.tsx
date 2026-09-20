"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Pencil, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { isValidEmail } from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type EmailChangeSectionProps = {
  currentEmail: string;
  emailVerified: boolean;
  pendingEmail: string | null;
};

// Email itself is never editable inline here — changing it always requires
// proving the new address via a code (see /account/verify-email), so this
// only ever collects the new address and hands off to that page.
export default function EmailChangeSection({ currentEmail, emailVerified, pendingEmail }: EmailChangeSectionProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [sending, setSending] = useState(false);

  const requestChange = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      showToast("ایمیل معتبر نیست.", "error");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/account/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.error ?? "درخواست کد با خطا مواجه شد.", "error");
        setSending(false);
        return;
      }
      showToast(`کد تأیید به ${trimmed} ارسال شد.`, "success");
      router.push("/account/verify-email");
    } catch {
      showToast("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", "error");
      setSending(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground/80">ایمیل</label>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3">
        <span dir="ltr" className="min-w-0 flex-1 truncate text-sm text-foreground">
          {currentEmail}
        </span>
        {emailVerified ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-[11px] font-medium text-accent-500">
            <CheckCircle2 className="size-3" />
            تأییدشده
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500">
            <Clock className="size-3" />
            تأییدنشده
          </span>
        )}
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-500 hover:underline"
          >
            <Pencil className="size-3" />
            تغییر ایمیل
          </button>
        )}
      </div>

      {pendingEmail && (
        <p dir="ltr" className="mt-1.5 flex items-center justify-end gap-1 text-right text-xs text-amber-500">
          در انتظار تأیید ایمیل جدید: {pendingEmail}
        </p>
      )}

      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            dir="ltr"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="ایمیل جدید"
            className={`${inputClass} max-w-xs flex-1`}
          />
          <button
            type="button"
            onClick={requestChange}
            disabled={sending}
            className="flex min-h-9 shrink-0 items-center rounded-full bg-accent-500 px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "در حال ارسال..." : "ارسال کد تأیید"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setNewEmail("");
            }}
            aria-label="انصراف"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
