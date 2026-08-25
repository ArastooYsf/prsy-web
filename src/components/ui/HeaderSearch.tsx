"use client";

import { useState } from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { Search, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchDropdownBanner from "@/components/ui/SearchDropdownBanner";
import { useSiteTheme } from "@/components/RouteThemeScope";

// Real category names already used across the site (src/lib/site-content-defaults.ts) —
// stand-ins for actual search-ranking results, which land later.
const POPULAR_SEARCHES = [
  "دیزل ژنراتور",
  "موتور برق",
  "قطعات یدکی دیزل ژنراتور و موتور برق",
  "دینام / آلترناتور",
  "خدمات اورهال و تعمیرات",
  "موتور ژنراتور",
];

// Timing reverse-engineered from Digikala's production search dropdown (its
// own CSS module, not copied assets): opening is slower with a soft
// overshoot-settle curve so the panel feels considered; closing is faster
// and linear so dismissing never feels like it's dragging. Toned down for
// this audience: their backdrop dims the page 30%, ours dims 20% — same
// "you're in search mode" cue, less assertive.
const OPEN_TRANSITION = { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };
const CLOSE_TRANSITION = { duration: 0.2, ease: "easeIn" as const };

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // Radix's Popover.Portal renders into document.body by default, outside
  // RouteThemeScope's wrapper div in the actual DOM — CSS custom properties
  // only inherit through real DOM ancestry, not React's tree, so the
  // portaled content misses the scoped .theme-white-blue override entirely
  // unless it's applied again directly here.
  const siteTheme = useSiteTheme();
  const isLightTheme = siteTheme?.theme !== "dark";

  const trimmed = query.trim();
  const filtered = trimmed ? POPULAR_SEARCHES.filter((s) => s.includes(trimmed)) : POPULAR_SEARCHES;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className="relative z-50 mx-auto w-full max-w-[17rem] sm:max-w-sm lg:max-w-md">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            aria-label="جست‌وجوی محصولات"
            placeholder="جست‌وجوی محصولات، دسته‌بندی‌ها..."
            className="h-11 w-full rounded-full border border-foreground/10 bg-foreground/5 pr-10 pl-9 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-accent-500/50"
          />
          {query && (
            // The visible icon stays small (size-4) to match the input's own
            // scale, but the tappable button itself is a full 44px hit target
            // (h-11 w-11, centered on the input) — extends slightly into the
            // row's own padding above/below, not clipped by anything there.
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="پاک کردن جست‌وجو"
              className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground/40 transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </Popover.Anchor>

      {/* Backdrop — same "you're in search mode now" cue Digikala uses
          (they dim toward white on a light page; a plain black dim would be
          nearly invisible on our already near-black background, so this
          softens/blurs the page behind instead, which reads on any theme).
          Kept outside Popover.Portal since it just needs fixed positioning,
          not anchor-relative placement. AnimatePresence (not Radix's own
          data-state classes) drives it because it isn't a Radix-managed
          element, so it needs its own exit-animation lifecycle. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: OPEN_TRANSITION }}
            exit={{ opacity: 0, transition: CLOSE_TRANSITION }}
            onClick={() => setOpen(false)}
            aria-hidden
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <Popover.Portal>
        <Popover.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className={cn(
            "z-50 max-h-[70vh] w-[var(--radix-popover-trigger-width)] origin-top overflow-y-auto overscroll-contain rounded-b-2xl rounded-t-none border border-foreground/10 bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2 data-[state=open]:duration-300 data-[state=open]:ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2 data-[state=closed]:duration-200 data-[state=closed]:ease-in",
            isLightTheme && "theme-white-blue",
          )}
        >
          {!trimmed && (
            <p className="flex items-center gap-1.5 px-5 pt-4 pb-2 text-xs font-semibold text-foreground/40">
              <TrendingUp className="size-4" />
              جست‌وجوهای پرطرفدار
            </p>
          )}

          {filtered.length > 0 ? (
            <div className={cn("flex flex-wrap gap-2.5 px-5 pb-4", !trimmed && "pt-1")}>
              {filtered.map((term) => (
                <Link
                  key={term}
                  href={`/products?q=${encodeURIComponent(term)}`}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-foreground/10 bg-foreground/5 px-3.5 py-2 text-sm text-foreground/80 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                >
                  {term}
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-5 py-7 text-center text-sm text-foreground/50">نتیجه‌ای یافت نشد.</p>
          )}

          {!trimmed && (
            <div className="border-t border-foreground/5">
              <SearchDropdownBanner
                title="مشاوره رایگان تخصصی"
                description="برای انتخاب دیزل ژنراتور یا موتور برق مناسب با کارشناسان ما مشورت کنید"
                href="/consultation"
                ctaLabel="درخواست مشاوره"
              />
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
