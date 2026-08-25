"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ProductCategoryContent } from "@/lib/site-content-defaults";
import { cn } from "@/lib/utils";
import { useLandingTheme } from "@/components/RouteThemeScope";

// Close is delayed (not instant on mouseleave) so moving the cursor from the
// trigger toward the panel — which briefly leaves both — doesn't flicker the
// menu shut. Same open/close asymmetry as the header search dropdown: opens
// a little slower and softer, closes quickly.
const CLOSE_DELAY = 180;
const OPEN_TRANSITION = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };
const CLOSE_TRANSITION = { duration: 0.18, ease: "easeIn" as const };

export function ProductsMegaMenu({ categories }: { categories: ProductCategoryContent[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(categories[0]?.id ?? null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tailwind Typography's prose-invert (light text) vs prose (dark text)
  // isn't a CSS-variable-driven choice like the rest of the .theme-white-blue
  // override, so it needs its own check — this component is shared by every
  // page via the header, and the landing page's own palette is now
  // toggleable rather than permanently light (see RouteThemeScope).
  const isLandingPage = usePathname() === "/";
  const landingTheme = useLandingTheme();
  const isLightTheme = isLandingPage && landingTheme?.theme !== "dark";

  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center px-0.5" data-nav-bump>
        <Link href="/products" className={buttonVariants({ variant: "ghost", size: "sm", className: "px-2.5" })}>
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
    setOpen(true);
  };

  const handleLeave = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  return (
    // onFocus/onBlur (not just mouse events) so keyboard-only navigation can
    // reach the flyout too — React's focus/blur are bubbling synthetic
    // events, so tabbing into any link inside the panel keeps it open the
    // same way onMouseEnter does, and tabbing past the last one closes it.
    // data-nav-bump + full-row height sits on this wrapper (not the inner
    // Link) so the hover "speed bump" hit-area matches the item's whole felt
    // column, same as every other nav item — see header-2.tsx.
    <div
      className="relative flex h-full items-center px-0.5"
      data-nav-bump
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <Link
        href="/products"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "px-2.5" })}
        aria-haspopup="true"
        aria-expanded={open}
      >
        محصولات
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: OPEN_TRANSITION }}
            exit={{ opacity: 0, y: -6, transition: CLOSE_TRANSITION }}
            className="absolute right-0 top-full z-50 mt-2 flex w-[36rem] overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl"
          >
            <div className="w-48 shrink-0 border-l border-foreground/10 py-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onMouseEnter={() => setActiveId(category.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-2.5 text-right text-sm transition-colors",
                    category.id === active.id
                      ? "bg-foreground/5 text-accent-400"
                      : "text-foreground/70 hover:bg-foreground/[0.03] hover:text-foreground",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 [&_svg]:size-4">
                    {CATEGORY_ICONS[category.iconKey]}
                  </span>
                  {category.title}
                </button>
              ))}
            </div>

            <div className="flex-1 p-5">
              <p className="text-sm font-bold text-foreground">{active.title}</p>
              <p
                className={cn(
                  "prose prose-sm mt-1 max-w-none text-xs leading-6 text-foreground/60 [&_p]:m-0",
                  !isLightTheme && "prose-invert",
                )}
                dangerouslySetInnerHTML={{ __html: active.description }}
              />

              {active.brands.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {active.brands.map((brand) => (
                    <span
                      key={brand}
                      className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[11px] text-foreground/70"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              )}

              <Link
                href={`/products#${active.id}`}
                onClick={() => setOpen(false)}
                className="group mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-400 transition-colors hover:text-accent-300"
              >
                مشاهده {active.title}
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
