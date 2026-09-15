"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Shared by the sidebar filter panel and the quick-access filter row above
// the grid — both read/write the same URL params, so toggling a brand in
// either place has to go through the same logic to stay in sync (they don't
// share React state; the URL itself, re-read via useSearchParams on
// navigation, is the single source of truth for both).
export function splitParam(v: string | null): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export function useCatalogFilters(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  return { searchParams, subs, brands, stockOnly, pushParams, toggleList, toggleStock, hasActive, clearAll };
}
