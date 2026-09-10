"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATALOG_SORTS } from "@/lib/catalog-query";

const SORT_LABELS: Record<(typeof CATALOG_SORTS)[number], string> = {
  newest: "جدیدترین",
  "price-asc": "ارزان‌ترین",
  "price-desc": "گران‌ترین",
  name: "نام",
};

export default function CatalogSortSelect({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "newest") params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2 text-sm text-foreground/70">
      <span className="shrink-0">مرتب‌سازی:</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-sm outline-none transition-colors focus:border-accent-500/50"
      >
        {CATALOG_SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
