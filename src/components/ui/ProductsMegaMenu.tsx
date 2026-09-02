"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ProductCategoryContent } from "@/lib/site-content-defaults";
import { cn } from "@/lib/utils";

// Close is delayed (not instant on mouseleave) so moving the cursor from the
// trigger toward the panel — which briefly leaves both — doesn't flicker the
// menu shut. Same open/close asymmetry as the header search dropdown: opens
// a little slower and softer, closes quickly.
const CLOSE_DELAY = 180;
const OPEN_TRANSITION = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };
const CLOSE_TRANSITION = { duration: 0.18, ease: "easeIn" as const };

type ProductsMegaMenuProps = {
  categories: ProductCategoryContent[];
  // The shared nav-bump indicator (header-2.tsx) needs to react to hover on
  // this component's own trigger link specifically — not the whole flyout
  // wrapper below, which has its own independent open/close hover area with
  // its own delay. Optional so this component still works standalone.
  onBumpEnter?: (el: HTMLElement) => void;
  onBumpLeave?: () => void;
  // The full-bleed panel is `position:fixed` so it spans the true viewport
  // width regardless of where its trigger sits in the header — it can't
  // breed off a `relative` ancestor the way the old `w-[36rem]` dropdown
  // did, since that ancestor is only as wide as the trigger link itself.
  // headerRef is the same ref header-2.tsx already measures for the mobile
  // drawer's `top` offset; reading its live rect here (not the header's
  // static `offsetHeight`) keeps the panel flush under the header even
  // while it's floating/inset on desktop scroll (`lg:top-4`).
  headerRef: React.RefObject<HTMLElement | null>;
};

export function ProductsMegaMenu({ categories, onBumpEnter, onBumpLeave, headerRef }: ProductsMegaMenuProps) {
  const [open, setOpen] = useState(false);
  // Lazily read on first render (not useState(0)) so the panel's very first
  // open of the session already has the real header-bottom offset instead
  // of a stale 0 — without this it paints pinned to the top of the screen
  // for one frame before the resize-driven effect below corrects it.
  const [panelTop, setPanelTop] = useState(() => (typeof window === "undefined" ? 0 : headerRef.current?.getBoundingClientRect().bottom ?? 0));
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const measureRaf = useRef<number | null>(null);
  // Tailwind Typography's prose-invert (light text) vs prose (dark text)
  // isn't a CSS-variable-driven choice like the rest of the .theme-white-blue
  // override, so it needs its own check — this component is shared by every
  // page via the header. The panel itself is deliberately always-dark (a
  // "control room" surface, matching the site's own default palette) rather
  // than following the page's light/dark theme, so its own prose is always
  // prose-invert regardless of isLightTheme.

  const measureTop = () => {
    if (headerRef.current) setPanelTop(headerRef.current.getBoundingClientRect().bottom);
  };

  useEffect(() => {
    if (!open) return;
    measureTop();
    // rAF-batched, same as SpotlightCursor's pointermove handling — scroll
    // fires far more often than once per frame, so this collapses a fast
    // scroll burst into at most one layout read + re-render per frame
    // instead of one per raw event.
    const scheduleMeasure = () => {
      if (measureRaf.current !== null) return;
      measureRaf.current = requestAnimationFrame(() => {
        measureRaf.current = null;
        measureTop();
      });
    };
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure);
      if (measureRaf.current !== null) cancelAnimationFrame(measureRaf.current);
      measureRaf.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, headerRef]);

  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center px-0.5">
        <Link
          href="/products"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "px-2.5" })}
          onMouseEnter={(e) => onBumpEnter?.(e.currentTarget)}
          onMouseLeave={() => onBumpLeave?.()}
        >
          محصولات
        </Link>
      </div>
    );
  }

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleEnter = () => {
    clearCloseTimer();
    // Measured synchronously here (not left to the effect below) so the
    // panel's first commit with open=true already carries the real
    // header-bottom offset — React 18 batches this with setOpen(true) into
    // one render, so there's never a frame painted at a stale `top` even if
    // the header's own position (e.g. its `lg:top-4` scrolled state) moved
    // since the last time this measured.
    measureTop();
    setOpen(true);
  };

  const handleLeave = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  return (
    // onFocus/onBlur (not just mouse events) so keyboard-only navigation can
    // reach the flyout too — React's focus/blur are bubbling synthetic
    // events, so tabbing into any link inside the panel keeps it open the
    // same way onMouseEnter does, and tabbing past the last one closes it.
    // This wrapper's own hover area (full row height, generous width) is
    // deliberately larger than the trigger link itself — that's the flyout's
    // own open/close hit area, independent of and unrelated to the shared
    // nav-bump indicator below, which instead binds directly to the trigger
    // Link's own onMouseEnter/onMouseLeave so it tracks that link's exact
    // rendered bounds, not this wrapper's.
    <div
      className="relative flex h-full items-center px-0.5"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <Link
        href="/products"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5 px-2.5" })}
        aria-haspopup="true"
        aria-expanded={open}
        onMouseEnter={(e) => onBumpEnter?.(e.currentTarget)}
        onMouseLeave={() => onBumpLeave?.()}
      >
        محصولات
        <ChevronDown aria-hidden className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: OPEN_TRANSITION }}
            exit={{ opacity: 0, y: -10, transition: CLOSE_TRANSITION }}
            style={{ top: panelTop }}
            className="fixed inset-x-0 z-50 border-y border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-black/40"
          >
            {/* max-h + overflow-y-auto: this is `position:fixed`, so unlike
                normal in-flow content it can't grow the page and scroll into
                view — a CMS-added category or a long brand list on a short
                viewport needs its own scroll container instead of clipping
                silently against the viewport edge. */}
            <div className="container grid max-h-[calc(100vh-6rem)] grid-cols-3 gap-x-8 gap-y-8 overflow-y-auto py-8 xl:grid-cols-6 xl:gap-x-6">
              {categories.map((category) => (
                <div key={category.id} className="flex flex-col">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 [&_svg]:size-4">
                      {CATEGORY_ICONS[category.iconKey]}
                    </span>
                    <h3 className="text-sm font-bold text-white">{category.title}</h3>
                  </div>

                  <div
                    className="prose prose-invert prose-sm mt-2.5 max-w-none text-xs leading-6 text-slate-400 [&_p]:m-0"
                    dangerouslySetInnerHTML={{ __html: category.description }}
                  />

                  {/* Real per-category data only goes two levels deep (category →
                      flat brand names, no per-brand description) — brands are
                      listed as items in their own right rather than padded out
                      with invented copy. The arrow is a UI affordance, not a
                      brand-specific icon, and sits on the row's other side per
                      spec, revealing on hover. */}
                  {category.brands.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-0.5">
                      {category.brands.map((brand) => (
                        <li key={brand}>
                          <Link
                            href={`/products#${category.id}`}
                            onClick={() => setOpen(false)}
                            className="group flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5 hover:text-accent-400"
                          >
                            <span className="truncate">{brand}</span>
                            <ArrowLeft
                              aria-hidden
                              className="size-3 shrink-0 -translate-x-1 text-slate-600 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-accent-400 group-hover:opacity-100"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link
                    href={`/products#${category.id}`}
                    onClick={() => setOpen(false)}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "group mt-4 gap-1.5 self-start border-white/15 bg-transparent text-xs text-white hover:border-accent-400/50 hover:bg-white/5 hover:text-accent-400",
                    })}
                  >
                    مشاهده همه
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
