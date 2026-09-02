"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// A form-level failure banner — for when the whole submit failed (a network
// error, a server-side validation the field-level messages don't cover),
// not a single field's error (that stays inline under the field, per the
// project's existing form pattern). Sits above the submit button so it's
// the first thing seen on a failed attempt. `onDismiss` is optional — most
// callers just let the next submit attempt replace or clear it.
export default function FormErrorBanner({
  message = "ثبت فرم با مشکل مواجه شد. لطفاً دوباره تلاش کنید.",
  onDismiss,
  className,
}: {
  message?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/[0.06] px-4 py-3 text-sm text-foreground/80",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <span className="flex-1 leading-6">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="بستن پیام خطا"
          className="shrink-0 rounded-md p-1 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground/70"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
