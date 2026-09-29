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

const LATIN_DIGITS: Record<string, string> = Object.fromEntries(
  Object.entries(PERSIAN_DIGITS).map(([latin, persian]) => [persian, latin]),
);

// The inverse of toPersianDigits — normalizes Persian numerals back to plain
// ASCII digits before parsing user input (e.g. FormattedNumberInput, where a
// Persian/Arabic keyboard can type ۰-۹ directly into a numeric field).
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (digit) => LATIN_DIGITS[digit]);
}

// The single call site for a bare numeric value anywhere on the site — counts,
// quantities, dashboard stats. The whole app is fa-IR/RTL, so numbers render
// with Persian digits/grouping by convention. Exempt: postal code, national ID,
// and alphanumeric technical IDs (e.g. order numbers) — those stay Latin.
export function formatNumber(value: number): string {
  return value.toLocaleString("fa-IR");
}

// Shared by every file-size display (ticket attachments, customer files, …).
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return toPersianDigits(`${bytes} B`);
  if (bytes < 1024 * 1024) return toPersianDigits(`${Math.round(bytes / 1024)} KB`);
  return toPersianDigits(`${(bytes / (1024 * 1024)).toFixed(1)} MB`);
}

// Unlike formatFileSize (tops out at MB — right for a single upload), this
// goes up to GB — for whole-disk/whole-directory totals (storage bars),
// which are realistically in that range.
export function formatBytesLarge(bytes: number): string {
  if (bytes < 1024) return toPersianDigits(`${bytes} بایت`);
  if (bytes < 1024 ** 2) return toPersianDigits(`${(bytes / 1024).toFixed(1)} کیلوبایت`);
  if (bytes < 1024 ** 3) return toPersianDigits(`${(bytes / 1024 ** 2).toFixed(1)} مگابایت`);
  return toPersianDigits(`${(bytes / 1024 ** 3).toFixed(2)} گیگابایت`);
}

// Shared by every storage-usage bar — "۰.۵٪" below 1%, whole numbers above.
export function formatPercent(value: number): string {
  const rounded = value < 1 && value > 0 ? value.toFixed(1) : Math.round(value).toString();
  return toPersianDigits(`${rounded}٪`);
}
