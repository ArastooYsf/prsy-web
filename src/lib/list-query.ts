export type ListSearchParams = Record<string, string | string[] | undefined>;

export function param(searchParams: ListSearchParams, key: string): string | undefined {
  const v = searchParams[key];
  const value = Array.isArray(v) ? v[0] : v;
  return value ? value : undefined;
}

function dayStart(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00`);
}

// Inclusive on both ends: `to` is bumped to the start of the next day since
// the stored value is a full DateTime, not a date-only column.
export function dateRangeWhere(
  searchParams: ListSearchParams,
  fromKey: string,
  toKey: string,
): { gte?: Date; lte?: Date } | undefined {
  const from = param(searchParams, fromKey);
  const to = param(searchParams, toKey);
  if (!from && !to) return undefined;

  const range: { gte?: Date; lte?: Date } = {};
  if (from) range.gte = dayStart(from);
  if (to) {
    const end = dayStart(to);
    end.setDate(end.getDate() + 1);
    range.lte = end;
  }
  return range;
}

// Single-cutoff filter (>= only) for fields that need one date, not a bounded
// range — e.g. contracts' start/end date filters ("از این تاریخ به بعد").
export function dateOnwardsWhere(searchParams: ListSearchParams, key: string): { gte: Date } | undefined {
  const from = param(searchParams, key);
  if (!from) return undefined;
  return { gte: dayStart(from) };
}

// Carries the active filters (and only the filters, not sort/dir) over to
// the export link so "دانلود اکسل" reflects whatever the list is currently
// showing rather than always exporting the unfiltered table.
export function filterQueryString(searchParams: ListSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "sort" || key === "dir") continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function sortParams<T extends string>(
  searchParams: ListSearchParams,
  allowed: readonly T[],
  defaultField: T,
): { field: T; dir: "asc" | "desc" } {
  const requested = param(searchParams, "sort");
  const field = (allowed as readonly string[]).includes(requested ?? "") ? (requested as T) : defaultField;
  const dir = param(searchParams, "dir") === "asc" ? "asc" : "desc";
  return { field, dir };
}
