"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import PriceRangeFilter from "@/components/products/PriceRangeFilter";

export type FacetOption = { label: string; slug: string };

type Props = {
  basePath: string;
  subLabel: string;
  subOptions: FacetOption[];
  brandOptions: FacetOption[];
  priceBounds: { min: number; max: number } | null;
};

export default function CatalogFilterPanel({ basePath, subLabel, subOptions, brandOptions, priceBounds }: Props) {
  const [openMobile, setOpenMobile] = useState(false);
  const { searchParams, subs, brands, stockOnly, pushParams, toggleList, toggleStock, hasActive, clearAll } =
    useCatalogFilters(basePath);

  const priceMin = priceBounds ? Number(searchParams.get("priceMin") ?? priceBounds.min) : null;
  const priceMax = priceBounds ? Number(searchParams.get("priceMax") ?? priceBounds.max) : null;

  const commitPrice = (min: number, max: number) => {
    pushParams((p) => {
      if (priceBounds && min > priceBounds.min) p.set("priceMin", String(Math.round(min)));
      else p.delete("priceMin");
      if (priceBounds && max < priceBounds.max) p.set("priceMax", String(Math.round(max)));
      else p.delete("priceMax");
    });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-foreground/10 py-4 first:pt-0 last:border-b-0">
      <p className="mb-2.5 text-sm font-bold text-foreground/80">{title}</p>
      {children}
    </div>
  );

  const CheckRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-foreground/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-foreground/20 accent-accent-500"
      />
      <span className="flex-1">{label}</span>
    </label>
  );

  const body = (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="size-4 text-accent-500" />
          فیلترها
        </p>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-foreground/50 transition-colors hover:text-red-400"
          >
            <X className="size-3.5" />
            پاک‌کردن
          </button>
        )}
      </div>

      {subOptions.length > 0 && (
        <Section title={subLabel}>
          {subOptions.map((o) => (
            <CheckRow key={o.slug} label={o.label} checked={subs.includes(o.slug)} onChange={() => toggleList("sub", o.slug)} />
          ))}
        </Section>
      )}

      {brandOptions.length > 0 && (
        <Section title="برند">
          {brandOptions.map((o) => (
            <CheckRow key={o.slug} label={o.label} checked={brands.includes(o.slug)} onChange={() => toggleList("brand", o.slug)} />
          ))}
        </Section>
      )}

      <Section title="موجودی">
        <CheckRow label="فقط کالاهای موجود" checked={stockOnly} onChange={toggleStock} />
      </Section>

      {priceBounds && priceMin !== null && priceMax !== null && (
        <Section title="بازه‌ی قیمت (تومان)">
          <PriceRangeFilter bounds={priceBounds} min={priceMin} max={priceMax} onCommit={commitPrice} />
        </Section>
      )}
    </div>
  );

  return (
    <>
      {/* mobile: disclosure */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          aria-expanded={openMobile}
          className="inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-foreground/10 px-4 text-sm font-semibold"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-accent-500" />
            فیلترها{hasActive ? " (فعال)" : ""}
          </span>
        </button>
        {openMobile && <div className="mt-3">{body}</div>}
      </div>
      {/* desktop: always visible */}
      <div className="hidden lg:block">{body}</div>
    </>
  );
}
