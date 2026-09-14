"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ImageOff, Search, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format-number";
import { SEARCH_MIN_QUERY_LENGTH, type SiteSearchResponse } from "@/lib/site-search";
import EmptyState from "@/components/ui/EmptyState";
import SearchDropdownBanner from "@/components/ui/SearchDropdownBanner";
import { useSiteTheme } from "@/components/RouteThemeScope";

// Shown before the user types anything — real category names already used
// across the site (src/lib/site-content-defaults.ts).
const POPULAR_SEARCHES = [
  "دیزل ژنراتور",
  "موتور برق",
  "قطعات یدکی دیزل ژنراتور و موتور برق",
  "دینام / آلترناتور",
  "خدمات اورهال و تعمیرات",
  "موتور ژنراتور",
];

const SEARCH_DEBOUNCE_MS = 300;

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
  const [results, setResults] = useState<SiteSearchResponse | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  // Radix's Popover.Portal renders into document.body by default, outside
  // RouteThemeScope's wrapper div in the actual DOM — CSS custom properties
  // only inherit through real DOM ancestry, not React's tree, so the
  // portaled content misses the scoped .theme-white-blue override entirely
  // unless it's applied again directly here.
  const siteTheme = useSiteTheme();
  const isLightTheme = siteTheme?.theme !== "dark";

  const trimmed = query.trim();
  const filteredTrending = trimmed
    ? POPULAR_SEARCHES.filter((s) => s.includes(trimmed))
    : POPULAR_SEARCHES;

  // Debounced, cancellable fetch against /api/search. `active` (rather than
  // relying on the AbortController alone) guards the `setLoadingResults`
  // calls too: an aborted fetch's rejection still resolves on the microtask
  // queue, which — without this flag — could land after the *next*
  // keystroke's effect already set loading back to true, flipping it off
  // again for a request that's still genuinely in flight.
  useEffect(() => {
    if (trimmed.length < SEARCH_MIN_QUERY_LENGTH) {
      setResults(null);
      setLoadingResults(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setLoadingResults(true);

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => (res.ok ? (res.json() as Promise<SiteSearchResponse>) : Promise.reject(new Error(String(res.status)))))
        .then((data) => {
          if (active) setResults(data);
        })
        .catch((err) => {
          if (active && (err as Error)?.name !== "AbortError") setResults({ products: [], categories: [] });
        })
        .finally(() => {
          if (active) setLoadingResults(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const hasResults = !!results && (results.categories.length > 0 || results.products.length > 0);

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
            onMouseDown={(e) => {
              // A second click while the input already has focus is the
              // *only* way to reach this with `open` already true — a first
              // click focuses the (until-now blurred) input, which the
              // onFocus handler above already opens the menu for, so
              // toggling on that same click would immediately re-close what
              // onFocus just opened.
              if (open && document.activeElement === e.currentTarget) {
                e.preventDefault();
                setOpen(false);
                e.currentTarget.blur();
              }
            }}
            aria-label="جست‌وجوی محصولات"
            placeholder="جست‌وجوی محصولات، دسته‌بندی‌ها..."
            className={cn(
              "h-11 w-full rounded-full border border-foreground/10 bg-foreground/5 pr-10 pl-9 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-accent-500/50",
              open && "rounded-b-none border-b-0",
            )}
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
          sideOffset={0}
          collisionPadding={8}
          className={cn(
            // sideOffset={0} plus the matching border/radius/color below is
            // what fuses this to the input above into one continuous shape —
            // no border on this edge (the input's own border-b-0, set when
            // open, is what draws that shared seam) and a bottom radius
            // matching the input's rounded-full corner at h-11 (22px), so the
            // curve the pill starts with is the exact curve this box ends on.
            "z-50 max-h-[70vh] w-[var(--radix-popover-trigger-width)] origin-top overflow-y-auto overscroll-contain rounded-t-none rounded-b-[22px] border border-t-0 border-foreground/10 bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2 data-[state=open]:duration-300 data-[state=open]:ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2 data-[state=closed]:duration-200 data-[state=closed]:ease-in",
            isLightTheme && "theme-white-blue",
          )}
        >
          {!trimmed ? (
            <>
              <p className="flex items-center gap-1.5 px-5 pt-4 pb-2 text-xs font-semibold text-foreground/40">
                <TrendingUp className="size-4" />
                جست‌وجوهای پرطرفدار
              </p>
              <div className="flex flex-wrap gap-2.5 px-5 pb-4 pt-1">
                {filteredTrending.map((term) => (
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
            </>
          ) : loadingResults && !results ? (
            <div className="animate-pulse space-y-2 px-5 py-4">
              <div className="h-11 rounded-lg bg-foreground/5" />
              <div className="h-11 rounded-lg bg-foreground/5" />
              <div className="h-11 rounded-lg bg-foreground/5" />
            </div>
          ) : hasResults ? (
            <div className="py-3">
              {results!.categories.length > 0 && (
                <div className="px-3 pb-1">
                  <p className="px-2 pb-1 text-xs font-semibold text-foreground/40">دسته‌بندی‌ها</p>
                  {results!.categories.map((category) => (
                    <Link
                      key={category.id}
                      href={category.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-foreground/5"
                    >
                      <span className="min-w-0 truncate">
                        {category.name}
                        {category.parentName && (
                          <span className="text-foreground/40"> در {category.parentName}</span>
                        )}
                      </span>
                      <ArrowLeft aria-hidden className="size-3.5 shrink-0 text-foreground/30" />
                    </Link>
                  ))}
                </div>
              )}

              {results!.products.length > 0 && (
                <div
                  className={cn(
                    "px-3 pt-1",
                    results!.categories.length > 0 && "mt-1 border-t border-foreground/5 pt-3",
                  )}
                >
                  <p className="px-2 pb-1 text-xs font-semibold text-foreground/40">محصولات</p>
                  {results!.products.map((product) => (
                    <Link
                      key={product.id}
                      href={product.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-foreground/5"
                    >
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                        {product.image ? (
                          <Image src={product.image} alt="" fill sizes="44px" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-foreground/25">
                            <ImageOff className="size-4" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm text-foreground/90">{product.name}</p>
                        {product.brandName && (
                          <p className="line-clamp-1 text-xs text-foreground/40">{product.brandName}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-xs font-semibold text-foreground/70">
                        {product.showPrice && product.price != null
                          ? `${formatNumber(product.price)} تومان`
                          : "استعلام قیمت"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState size="sm" icon={<Search />} title="نتیجه‌ای یافت نشد." description="با عبارت دیگه‌ای امتحان کنید." />
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
