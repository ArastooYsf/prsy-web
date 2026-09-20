// Starter suggestions for a spec's "unit" field (datalist in the admin
// product form) — the generator/engine/alternator units the shipped spec
// template already uses. Anything an admin types that isn't here is
// remembered server-side (src/lib/spec-suggestions.ts) and joins this list.
export const BASE_SPEC_UNITS = [
  "کاوا",
  "کیلووات",
  "وات",
  "آمپر",
  "ولت",
  "هرتز",
  "لیتر",
  "لیتر بر ساعت",
  "دور بر دقیقه",
  "کیلوگرم",
  "میلی‌متر",
  "سانتی‌متر",
  "متر",
  "سی‌سی",
  "درجه سانتی‌گراد",
  "درصد",
  "دسی‌بل",
  "عدد",
];

export type SpecSuggestions = { units: string[]; labels: string[] };

export function uniqueStrings(...lists: readonly (readonly string[])[]): string[] {
  return [...new Set(lists.flat())];
}
