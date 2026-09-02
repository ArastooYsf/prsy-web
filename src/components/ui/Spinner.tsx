import { cn } from "@/lib/utils";

// A branded fallback spinner — for the loading moments a dedicated Skeleton
// doesn't cover yet (see loading.tsx files that render this directly) and
// for small in-button loading states. A partial ring (not a full circle)
// so the rotation itself reads as motion rather than a static ring —
// `currentColor` so callers set the color via a text- utility, defaulting
// to the accent, the same way the errors/ icon family does.
export default function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-5 animate-spin text-accent-400", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
