"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { formatNumber } from "@/lib/format-number";

export type FacetOption = { label: string; slug: string };

type Props = {
  basePath: string;
  subLabel: string;
  subOptions: FacetOption[];
  brandOptions: FacetOption[];
  priceBounds: { min: number; max: number } | null;
};

function splitParam(v: string | null): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export default function CatalogFilterPanel({ basePath, subLabel, subOptions, brandOptions, priceBounds }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openMobile, setOpenMobile] = useState(false);

  const subs = splitParam(searchParams.get("sub"));
  const brands = splitParam(searchParams.get("brand"));
  const stockOnly = searchParams.get("stock") === "1";

  const pushParams = (mutate: (p: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  const toggleList = (key: "sub" | "brand", slug: string) => {
    pushParams((p) => {
      const cur = splitParam(p.get(key));
      const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
      if (next.length) p.set(key, next.join(","));
      else p.delete(key);
    });
  };

  const toggleStock = () => pushParams((p) => (stockOnly ? p.delete("stock") : p.set("stock", "1")));

  const hasActive =
    subs.length > 0 || brands.length > 0 || stockOnly || searchParams.has("priceMin") || searchParams.has("priceMax");

  const clearAll = () => router.push(basePath, { scroll: false });

  // --- price slider (debounced) ---
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!priceBounds) return;
    const qpMin = searchParams.get("priceMin");
    const qpMax = searchParams.get("priceMax");
    setPriceMin(qpMin !== null ? Number(qpMin) : priceBounds.min);
    setPriceMax(qpMax !== null ? Number(qpMax) : priceBounds.max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, priceBounds?.min, priceBounds?.max]);

  const commitPrice = (min: number, max: number) => {
    if (priceTimer.current) clearTimeout(priceTimer.current);
    priceTimer.current = setTimeout(() => {
      pushParams((p) => {
        if (priceBounds && min > priceBounds.min) p.set("priceMin", String(Math.round(min)));
        else p.delete("priceMin");
        if (priceBounds && max < priceBounds.max) p.set("priceMax", String(Math.round(max)));
        else p.delete("priceMax");
      });
    }, 320);
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
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground/50 transition-colors hover:text-red-400"
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
          <div className="flex items-center justify-between text-xs text-foreground/60" dir="ltr">
            <span>{formatNumber(priceMin)}</span>
            <span>{formatNumber(priceMax)}</span>
          </div>
          <div className="mt-2 space-y-2" dir="ltr">
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={priceMin}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), priceMax);
                setPriceMin(v);
                commitPrice(v, priceMax);
              }}
              className="w-full accent-accent-500"
              aria-label="کمترین قیمت"
            />
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={priceMax}
              onChange={(e) => {
                const v = Math.max(Number(e.target.value), priceMin);
                setPriceMax(v);
                commitPrice(priceMin, v);
              }}
              className="w-full accent-accent-500"
              aria-label="بیشترین قیمت"
            />
          </div>
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
