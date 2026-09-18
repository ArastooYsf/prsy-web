"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Package, Search, X } from "lucide-react";
import { formatNumber } from "@/lib/format-number";
import { ADMIN_PRODUCT_SEARCH_MIN_QUERY_LENGTH, type AdminProductSearchResult } from "@/lib/admin-product-search";
import { useScrollIntoViewOnOpen } from "@/hooks/useScrollIntoViewOnOpen";
import { useSiteTheme } from "@/components/RouteThemeScope";
import { popoverAnimation } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type ProductPickerProps = {
  /** Non-null once this row is linked to a catalog product; typing is then locked to the picker instead of free text. */
  productId: string | null;
  productName: string;
  onManualNameChange: (name: string) => void;
  onSelectProduct: (product: AdminProductSearchResult) => void;
  onClearProduct: () => void;
  invalid?: boolean;
};

// Inline searchable combobox for one order-item row: typing free text keeps
// the row a manual/custom item, while picking a result from the dropdown
// links it to a real catalog Product (see OrderForm's Item type). Mirrors
// HeaderSearch's Popover.Anchor + debounced-fetch pattern, scoped down to a
// single row instead of a full-page overlay.
export default function ProductPicker({
  productId,
  productName,
  onManualNameChange,
  onSelectProduct,
  onClearProduct,
  invalid,
}: ProductPickerProps) {
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<AdminProductSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const linked = productId !== null;
  const trimmed = productName.trim();

  useEffect(() => {
    if (linked || trimmed.length < ADMIN_PRODUCT_SEARCH_MIN_QUERY_LENGTH) {
      setResults(null);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(() => {
      fetch(`/api/admin/products/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data) => {
          if (active) setResults(data.products ?? []);
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

  const showDropdown = focused && !linked && trimmed.length >= ADMIN_PRODUCT_SEARCH_MIN_QUERY_LENGTH;
  const contentRef = useScrollIntoViewOnOpen<HTMLDivElement>(showDropdown);
  // Popover.Portal renders into document.body, outside RouteThemeScope's
  // wrapper div — CSS variables only inherit through real DOM ancestry, so
  // the theme class must be reapplied here (see HeaderSearch.tsx).
  const siteTheme = useSiteTheme();
  const isLightTheme = siteTheme?.theme !== "dark";

  return (
    <Popover.Root open={showDropdown} onOpenChange={(o) => !o && setFocused(false)}>
      <Popover.Anchor asChild>
        <div className="relative min-w-0 flex-1">
          {linked ? (
            <Package className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-accent-400" />
          ) : (
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/30" />
          )}
          <input
            value={productName}
            readOnly={linked}
            onChange={(e) => !linked && onManualNameChange(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="نام محصول، یا جست‌وجو در کاتالوگ..."
            className={`${inputClass} pr-10 ${linked ? "cursor-default border-accent-500/30 bg-accent-500/5 pl-10" : "pl-4"} ${
              invalid ? "border-red-500/50" : ""
            }`}
          />
          {linked && (
            <button
              type="button"
              onClick={onClearProduct}
              aria-label="لغو اتصال به محصول کاتالوگ"
              title="لغو اتصال به محصول کاتالوگ"
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
            results.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onSelectProduct(product);
                  setFocused(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-right text-sm transition-colors hover:bg-foreground/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 block text-foreground/90">{product.name}</span>
                  {product.brandName && <span className="block text-xs text-foreground/40">{product.brandName}</span>}
                </span>
                <span className="shrink-0 text-xs font-medium text-foreground/60">
                  {product.price != null ? `${formatNumber(product.price)} تومان` : "بدون قیمت"}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-center text-xs text-foreground/40">محصولی یافت نشد — به‌صورت دستی وارد کنید.</p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
