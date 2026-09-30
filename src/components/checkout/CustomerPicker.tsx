"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Search, User, X } from "lucide-react";
import { ADMIN_CUSTOMER_SEARCH_MIN_QUERY_LENGTH, type AdminCustomerSearchResult } from "@/lib/admin-customer-search";
import { useScrollIntoViewOnOpen } from "@/hooks/useScrollIntoViewOnOpen";
import { useSiteTheme } from "@/components/RouteThemeScope";
import { popoverAnimation } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export type SelectedCustomer = { id: string; label: string };

// Searchable combobox for "which customer is this order for" — mirrors
// ProductPicker's Popover.Anchor + debounced-fetch pattern (same codebase
// convention), scoped to customers instead of catalog products.
export default function CustomerPicker({
  selected,
  onSelect,
  onClear,
}: {
  selected: SelectedCustomer | null;
  onSelect: (customer: SelectedCustomer) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<AdminCustomerSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const linked = selected !== null;
  const trimmed = query.trim();

  useEffect(() => {
    if (linked || trimmed.length < ADMIN_CUSTOMER_SEARCH_MIN_QUERY_LENGTH) {
      setResults(null);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(() => {
      fetch(`/api/admin/customers/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data) => {
          if (active) setResults(data.customers ?? []);
        })
        .catch((err) => {
          if (active && (err as Error)?.name !== "AbortError") setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, linked]);

  const showDropdown = focused && !linked && trimmed.length >= ADMIN_CUSTOMER_SEARCH_MIN_QUERY_LENGTH;
  const contentRef = useScrollIntoViewOnOpen<HTMLDivElement>(showDropdown);
  // Popover.Portal renders into document.body, outside RouteThemeScope's
  // wrapper div — CSS variables only inherit through real DOM ancestry, so
  // the theme class must be reapplied here (see ProductPicker/HeaderSearch).
  const siteTheme = useSiteTheme();
  const isLightTheme = siteTheme?.theme !== "dark";

  return (
    <Popover.Root open={showDropdown} onOpenChange={(o) => !o && setFocused(false)}>
      <Popover.Anchor asChild>
        <div className="relative min-w-0 flex-1">
          {linked ? (
            <User className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-accent-400" />
          ) : (
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/30" />
          )}
          <input
            value={linked ? selected.label : query}
            readOnly={linked}
            onChange={(e) => !linked && setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="نام، ایمیل یا شماره تماس مشتری را جست‌وجو کنید..."
            className={`${inputClass} pr-10 ${linked ? "cursor-default border-accent-500/30 bg-accent-500/5 pl-10" : "pl-4"}`}
          />
          {linked && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setQuery("");
              }}
              aria-label="لغو انتخاب مشتری"
              title="لغو انتخاب مشتری"
              className="absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-foreground/40 transition-colors hover:text-red-400"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          onOpenAutoFocus={(e) => e.preventDefault()}
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 max-h-64 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-xl border border-foreground/10 bg-background p-1.5 shadow-2xl",
            isLightTheme && "theme-white-blue",
            popoverAnimation,
          )}
        >
          {loading && !results ? (
            <div className="space-y-1.5 p-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-foreground/5" />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect({ id: c.id, label: c.name ? `${c.name} (${c.email})` : c.email });
                  setFocused(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-right text-sm transition-colors hover:bg-foreground/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 block text-foreground/90">{c.name || c.email}</span>
                  <span dir="ltr" className="block text-xs text-foreground/40">
                    {c.name ? c.email : ""}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-center text-xs text-foreground/40">مشتری‌ای یافت نشد.</p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
