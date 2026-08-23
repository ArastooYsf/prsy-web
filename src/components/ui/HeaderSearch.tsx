"use client";

import { useState } from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchDropdownBanner from "@/components/ui/SearchDropdownBanner";

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

export function HeaderSearch({ compact }: { compact: boolean }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const trimmed = query.trim();
  const filtered = trimmed ? POPULAR_SEARCHES.filter((s) => s.includes(trimmed)) : POPULAR_SEARCHES;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className="relative mx-auto w-full max-w-[15rem] sm:max-w-xs lg:max-w-sm">
          <Search
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40 transition-all lg:duration-300 lg:ease-in-out",
              compact && "lg:size-3.5 lg:right-2.5",
            )}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            aria-label="جست‌وجوی محصولات"
            placeholder="جست‌وجوی محصولات، دسته‌بندی‌ها..."
            className={cn(
              "h-9 w-full rounded-full border border-white/10 bg-white/5 pr-9 pl-3 text-sm text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-accent-500/50 lg:h-9 lg:duration-300 lg:ease-in-out",
              compact && "lg:h-7 lg:pr-8 lg:text-xs",
            )}
          />
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="z-50 max-h-[70vh] w-[var(--radix-popover-trigger-width)] overflow-y-auto overscroll-contain rounded-b-2xl rounded-t-none border border-white/10 bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {!trimmed && (
            <p className="flex items-center gap-1.5 px-4 pt-3 pb-1.5 text-[11px] font-semibold text-foreground/40">
              <TrendingUp className="size-3.5" />
              جست‌وجوهای پرطرفدار
            </p>
          )}

          {filtered.length > 0 ? (
            <div className={cn("flex flex-wrap gap-2 px-4 pb-3", !trimmed && "pt-1")}>
              {filtered.map((term) => (
                <Link
                  key={term}
                  href={`/products?q=${encodeURIComponent(term)}`}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                >
                  {term}
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-foreground/50">نتیجه‌ای یافت نشد.</p>
          )}

          {!trimmed && (
            <div className="border-t border-white/5">
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
