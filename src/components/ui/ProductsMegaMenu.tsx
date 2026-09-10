"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ProductCategoryContent } from "@/lib/site-content-defaults";
import { cn } from "@/lib/utils";

// Close is delayed (not instant on mouseleave) so moving the cursor from the
// trigger toward the panel — which briefly leaves both — doesn't flicker the
// menu shut. Opens a little slower and softer, closes quickly.
const CLOSE_DELAY = 180;
const OPEN_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };
const CLOSE_TRANSITION = { duration: 0.16, ease: "easeIn" as const };
// The rail→panel swap is the defining interaction of this pattern: it must
// feel instant. This is a soft fade-in only (no exit wait), so the new
// category's content is on screen the same frame the cursor lands.
const PANEL_SWAP_TRANSITION = { duration: 0.14, ease: [0.16, 1, 0.3, 1] as const };

type ProductsMegaMenuProps = {
  categories: ProductCategoryContent[];
  // The shared nav-bump indicator (header-2.tsx) reacts to hover on this
  // component's own trigger link specifically — not the flyout wrapper, which
  // has its own independent open/close hover area with its own delay.
  onBumpEnter?: (el: HTMLElement) => void;
  onBumpLeave?: () => void;
};

export function ProductsMegaMenu({ categories, onBumpEnter, onBumpLeave }: ProductsMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | undefined>(categories[0]?.id);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center px-0.5">
        <Link
          href="/products"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm", className: "px-2.5" }),
            "hover:bg-transparent hover:text-foreground",
          )}
          onMouseEnter={(e) => onBumpEnter?.(e.currentTarget)}
          onMouseLeave={() => onBumpLeave?.()}
        >
          محصولات
        </Link>
      </div>
    );
  }

  const activeCategory = categories.find((c) => c.id === activeId) ?? categories[0];

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleEnter = () => {
    clearCloseTimer();
    // Only reset the active category on a real open — not on every bubbled
    // focus event. onFocus bubbles here from the rail/panel links too, and
    // resetting then would snap a keyboard user back to the first category
    // each time they tab to another one.
    if (!open) setActiveId(categories[0]?.id);
    setOpen(true);
  };

  const handleLeave = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  return (
    // onFocus/onBlur (not just mouse events) so keyboard-only navigation can
    // reach the flyout too — React's focus/blur are bubbling synthetic events,
    // so tabbing into any link inside the panel keeps it open and tabbing past
    // the last one closes it.
    <div
      className="relative flex h-full items-center px-0.5"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <Link
        href="/products"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5 px-2.5" }),
          "hover:bg-transparent hover:text-foreground",
        )}
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: OPEN_TRANSITION }}
            exit={{ opacity: 0, y: -8, transition: CLOSE_TRANSITION }}
            // A bounded box anchored under the trigger (RTL: right edge aligns
            // with the trigger, box grows toward the centre) — not the old
            // full-bleed bar. `absolute` relative to this `relative` wrapper
            // means it tracks the trigger through the header's scrolled/floating
            // states with no measurement code.
            className="absolute right-0 top-full z-50 mt-2 w-[37rem] max-w-[calc(100vw-2rem)]"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-black/40">
              {/* min-h (not a fixed height): the rail's own content is
                  identical for every category and is the tallest element, so
                  the box height is effectively constant and does not jump as
                  the panel content swaps — without stranding empty space under
                  a category that has only a few brands. */}
              <div className="flex min-h-[17rem] max-h-[calc(100vh-8rem)]">
                {/* Narrow rail: every main category, hover (or focus) swaps the
                    panel beside it. Click still navigates to the category. */}
                <ul className="w-56 shrink-0 overflow-y-auto border-l border-border bg-foreground/[0.03] p-2">
                  {categories.map((category) => {
                    const isActive = category.id === activeCategory.id;
                    return (
                      <li key={category.id}>
                        <Link
                          href={`/products#${category.id}`}
                          onClick={() => setOpen(false)}
                          onMouseEnter={() => setActiveId(category.id)}
                          onFocus={() => setActiveId(category.id)}
                          className={cn(
                            "group flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-medium leading-snug transition-colors",
                            isActive
                              ? "bg-accent-500/10 text-accent-500"
                              : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors [&_svg]:size-4",
                              isActive ? "bg-accent-500/15 text-accent-500" : "bg-foreground/5 text-foreground/50",
                            )}
                          >
                            {CATEGORY_ICONS[category.iconKey]}
                          </span>
                          <span className="min-w-0 flex-1">{category.title}</span>
                          <ChevronLeft
                            aria-hidden
                            className={cn(
                              "size-4 shrink-0 transition-all",
                              isActive
                                ? "text-accent-500 opacity-100"
                                : "-translate-x-1 text-foreground/30 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                            )}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Wide panel: keyed on the active category so it re-mounts and
                    re-fades on every rail change. No AnimatePresence / exit —
                    the new content mounts the same frame, so switching feels
                    instant (the defining behaviour of this pattern). */}
                <div className="min-w-0 flex-1 overflow-y-auto p-5">
                  <motion.div
                    key={activeCategory.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={PANEL_SWAP_TRANSITION}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500 [&_svg]:size-5">
                          {CATEGORY_ICONS[activeCategory.iconKey]}
                        </span>
                        <h3 className="text-sm font-bold">{activeCategory.title}</h3>
                      </div>
                      <Link
                        href={`/products#${activeCategory.id}`}
                        onClick={() => setOpen(false)}
                        className="group inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent-500 transition-colors hover:bg-accent-500/10"
                      >
                        مشاهده همه
                        <ArrowLeft aria-hidden className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                      </Link>
                    </div>

                    {activeCategory.description && (
                      <div
                        className="mt-2 text-xs leading-6 text-muted-foreground [&_p]:m-0"
                        dangerouslySetInnerHTML={{ __html: activeCategory.description }}
                      />
                    )}

                    {activeCategory.brands.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          برندها
                        </p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {activeCategory.brands.map((brand) => (
                            <li key={brand}>
                              <Link
                                href={`/products#${activeCategory.id}`}
                                onClick={() => setOpen(false)}
                                className="group flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-accent-500"
                              >
                                <span className="truncate">{brand}</span>
                                <ArrowLeft
                                  aria-hidden
                                  className="size-3 shrink-0 -translate-x-1 text-foreground/20 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-accent-500 group-hover:opacity-100"
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
