const PERSIAN_DIGITS: Record<string, string> = {
  "0": "۰",
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵",
  "6": "۶",
  "7": "۷",
  "8": "۸",
  "9": "۹",
};

// Converts any digits inside a string/number to Persian numerals — for
// composite text ("۱۲ روز", "۰۰:۰۰") where a bare formatNumber() call can't be used.
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[digit]);
}

// The single call site for a bare numeric value anywhere on the site — counts,
// quantities, dashboard stats. The whole app is fa-IR/RTL, so numbers render
// with Persian digits/grouping by convention. Exempt: postal code, national ID,
// and alphanumeric technical IDs (e.g. order numbers) — those stay Latin.
export function formatNumber(value: number): string {
  return value.toLocaleString("fa-IR");
}
