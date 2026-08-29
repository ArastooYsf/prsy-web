"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import DateInput, { type Calendar } from "@/components/admin/DateInput";
import { scrollFieldAboveKeyboard } from "@/lib/scroll-into-view";

const selectClass =
  "min-h-11 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground outline-none transition-colors focus:border-accent-500/50";

export type SelectFilter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
};
export type DateRangeFilter = { fromKey: string; toKey: string; label: string };
/** A single-cutoff date filter (one field, not a from/to pair) — e.g. "تاریخ شروع". */
export type DateFilter = { key: string; label: string };

type ListFilterBarProps = {
  searchPlaceholder?: string;
  selects?: SelectFilter[];
  dateRanges?: DateRangeFilter[];
  dates?: DateFilter[];
};

export default function ListFilterBar({ searchPlaceholder, selects = [], dateRanges = [], dates = [] }: ListFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [calendar, setCalendar] = useState<Calendar>("jalali");
  const isFirstRender = useRef(true);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      updateParam("q", query || null);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const hasActiveFilters =
    !!searchParams.get("q") ||
    selects.some((s) => !!searchParams.get(s.key)) ||
    dateRanges.some((d) => !!searchParams.get(d.fromKey) || !!searchParams.get(d.toKey)) ||
    dates.some((d) => !!searchParams.get(d.key));

  return (
    <div className="mb-4 flex flex-wrap items-start gap-2">
      {searchPlaceholder && (
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => scrollFieldAboveKeyboard(e.currentTarget)}
            placeholder={searchPlaceholder}
            className="min-h-11 w-full rounded-lg border border-foreground/10 bg-foreground/5 py-2 pl-3 pr-9 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-accent-500/50"
          />
        </div>
      )}

      {selects.map((s) => (
        <select
          key={s.key}
          value={searchParams.get(s.key) ?? ""}
          onChange={(e) => updateParam(s.key, e.target.value || null)}
          className={selectClass}
        >
          <option value="">{s.allLabel ?? `${s.label}: همه`}</option>
          {s.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {dateRanges.map((d, i) => (
        <div key={d.fromKey} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground/50">{d.label}</span>
          <div className="flex items-start gap-2">
            <div className="w-36">
              <DateInput
                label="از"
                value={searchParams.get(d.fromKey) ?? ""}
                onChange={(v) => updateParam(d.fromKey, v || null)}
                calendar={calendar}
                onCalendarChange={setCalendar}
                hideToggle={i > 0}
              />
            </div>
            <div className="w-36">
              <DateInput
                label="تا"
                value={searchParams.get(d.toKey) ?? ""}
                onChange={(v) => updateParam(d.toKey, v || null)}
                calendar={calendar}
                onCalendarChange={setCalendar}
                hideToggle
              />
            </div>
          </div>
        </div>
      ))}

      {dates.map((d, i) => (
        <div key={d.key} className="w-36">
          <DateInput
            label={d.label}
            value={searchParams.get(d.key) ?? ""}
            onChange={(v) => updateParam(d.key, v || null)}
            calendar={calendar}
            onCalendarChange={setCalendar}
            // Only the very first date field in the whole bar shows a toggle
            // (rendered in JSX order: dateRanges, then dates) — if dateRanges
            // already rendered one, every `dates` field hides its own too.
            hideToggle={dateRanges.length > 0 || i > 0}
          />
        </div>
      ))}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs font-medium text-foreground/50 transition-colors hover:text-red-400"
        >
          <X className="size-3.5" />
          پاک‌کردن فیلترها
        </button>
      )}
    </div>
  );
}
