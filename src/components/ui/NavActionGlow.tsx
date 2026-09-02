"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// A small standalone hover highlight for nav action buttons that sit outside
// the shared sliding trapezoid indicator (see the nav-bump system in
// header-2.tsx) — each instance is independent since these buttons (theme
// toggle, account, contact, consultation CTA) aren't part of one row a
// single shared shape can slide between.
//
// Built as a `box-shadow` ring, not a separate absolutely-positioned fill
// layer: a spread shadow with no blur paints *only* outside the element's
// own box by construction, so it can never wash over that button's own
// text/icon regardless of stacking order — there's no z-index tension to
// get right, unlike a filled overlay would have. `colorVar` is each
// button's own real color (its solid background for a filled CTA, its
// border for an outline button) — never a shared generic tone — so the
// ring reads as that button's own surface extending outward on hover, not
// a foreign highlight competing with it.
export function NavActionGlow({ children, className, colorVar }: { children: ReactNode; className?: string; colorVar: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md shadow-[0_0_0_0_transparent] transition-[box-shadow] duration-150",
        "hover:shadow-[0_0_0_4px_rgb(var(--nav-glow-color)/0.35)] focus-within:shadow-[0_0_0_4px_rgb(var(--nav-glow-color)/0.35)]",
        className,
      )}
      style={{ "--nav-glow-color": colorVar } as CSSProperties}
    >
      {children}
    </span>
  );
}
