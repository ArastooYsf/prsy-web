export type ListSearchParams = Record<string, string | string[] | undefined>;

export function param(searchParams: ListSearchParams, key: string): string | undefined {
  const v = searchParams[key];
  const value = Array.isArray(v) ? v[0] : v;
  return value ? value : undefined;
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
  if (from) range.gte = new Date(`${from}T00:00:00`);
  if (to) {
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    range.lte = end;
  }
  return range;
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
