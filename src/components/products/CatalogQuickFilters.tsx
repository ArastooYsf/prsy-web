"use client";

import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import type { FacetOption } from "@/components/products/CatalogFilterPanel";

// Quick-access checkboxes above the grid, for the handful of filters worth
// one click instead of opening the full sidebar panel — same URL params as
// CatalogFilterPanel (via the shared hook), so toggling here or there stays
// in sync without any shared component state.
const MAX_QUICK_BRANDS = 6;

function QuickCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-foreground/10 px-3 text-xs font-medium text-foreground/70 transition-colors has-[:checked]:border-accent-500/40 has-[:checked]:bg-accent-500/10 has-[:checked]:text-accent-400">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-3.5 rounded border-foreground/20 accent-accent-500"
      />
      {label}
    </label>
  );
}

export default function CatalogQuickFilters({ basePath, brandOptions }: { basePath: string; brandOptions: FacetOption[] }) {
  const { brands, stockOnly, toggleList, toggleStock } = useCatalogFilters(basePath);

  // "فقط موجود" is always worth a quick toggle regardless of whether this
  // category happens to have any brands — it must never be tied to
  // quickBrands being non-empty.
  const quickBrands = brandOptions.slice(0, MAX_QUICK_BRANDS);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="ml-1 text-xs font-semibold text-foreground/40">دسترسی سریع:</span>

      <QuickCheckbox label="فقط موجود" checked={stockOnly} onChange={toggleStock} />

      {quickBrands.map((o) => (
        <QuickCheckbox
          key={o.slug}
          label={o.label}
          checked={brands.includes(o.slug)}
          onChange={() => toggleList("brand", o.slug)}
        />
      ))}
    </div>
  );
}
