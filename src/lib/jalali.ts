import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { toPersianDigits } from "@/lib/format-number";

export { toPersianDigits } from "@/lib/format-number";

const jalaliFormatter = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" });
const gregorianFormatter = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });

export function formatJalali(date: string | Date): string {
  return jalaliFormatter.format(new Date(date));
}

export function formatGregorian(date: string | Date): string {
  return gregorianFormatter.format(new Date(date));
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export type JalaliDate = { jy: number; jm: number; jd: number };

// value is always a Gregorian ISO date string ("YYYY-MM-DD") — the single
// source of truth stored in state/DB. These helpers only convert for display
// and for the Jalali picker's three <select> inputs.
export function isoToJalali(value: string): JalaliDate | null {
  if (!value) return null;
  const [gy, gm, gd] = value.split("-").map(Number);
  if (!gy || !gm || !gd) return null;
  return toJalaali(gy, gm, gd);
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return `${String(gy).padStart(4, "0")}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function daysInJalaliMonth(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

export function currentJalaliYear(): number {
  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate()).jy;
}

// "۱۴۰۴/۰۵/۲۲ ساعت ۱۴:۳۲:۰۵" — used for the human-readable event log report.
export function formatJalaliDateTime(date: string | Date): string {
  const d = new Date(date);
  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const dateStr = `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
  const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  return toPersianDigits(`${dateStr} ساعت ${timeStr}`);
}
