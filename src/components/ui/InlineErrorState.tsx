"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// A compact, inline failure notice for one specific request inside an
// already-loaded page (a message that failed to send, a save that failed) —
// deliberately not a full illustration/EmptyState treatment, since the rest
// of the page is still perfectly usable and a big illustration would
// overstate a single failed request. Calm destructive tint, plain language,
// one clear retry action — never a raw error string.
export default function InlineErrorState({
  message = "این عملیات انجام نشد.",
  onRetry,
  retryLabel = "تلاش مجدد",
  className,
}: {
  message?: string;
  onRetry: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3.5 py-2.5 text-sm text-foreground/80",
        className,
      )}
    >
      <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-full border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        {retryLabel}
      </button>
    </div>
  );
}
