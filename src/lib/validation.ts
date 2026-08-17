const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

// Persian/Arabic-Indic keyboards produce non-ASCII digit characters (the
// project's own phone placeholders use them, e.g. "۰۹۱۲۳۴۵۶۷۸۹"), so phone
// validation must normalize them before matching an ASCII-digit regex.
export function normalizeDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(ch);
    if (persianIndex !== -1) return String(persianIndex);
    return String(ARABIC_INDIC_DIGITS.indexOf(ch));
  });
}

// Iranian mobile numbers: optional +98 / 0098 / 98 / 0 prefix, then 9 and 9
// more digits (11 digits total in the common 09xxxxxxxxx form).
const IRAN_MOBILE_RE = /^(?:\+98|0098|98|0)?9\d{9}$/;

export function isValidIranPhone(phone: string): boolean {
  const cleaned = normalizeDigits(phone).replace(/[\s\-()]/g, "");
  return IRAN_MOBILE_RE.test(cleaned);
}
