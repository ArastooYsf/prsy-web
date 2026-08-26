// Split out from admin-stats.ts so client components can import the range
// type/labels without pulling in that file's `import { prisma }` — prisma's
// mariadb driver is Node-only (uses `fs`) and breaks the client bundle.
import { toJalaali } from "jalaali-js";
import { JALALI_MONTHS, toPersianDigits } from "@/lib/jalali";

export type StatsRange = "today" | "7d" | "30d" | "1y" | "all";

export const RANGE_LABELS: Record<StatsRange, string> = {
  today: "امروز",
  "7d": "۷ روز اخیر",
  "30d": "۱ ماه اخیر",
  "1y": "۱ سال اخیر",
  all: "کل",
};

export const ALL_STATS_RANGES: StatsRange[] = ["today", "7d", "30d", "1y", "all"];

// Exported so other files that need a plain "date -> ISO day key" or
// "date -> Jalali MM/DD label" (log-stats.ts, uptime.ts, the Lighthouse
// trend chart) reuse this instead of re-deriving the same toJalaali call.
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function jalaliDayLabel(date: Date): string {
  const { jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

export type RangeBucket = { key: string; label: string; start: Date; end: Date };

// Buckets computed in JS rather than SQL date-trunc since the app has no
// raw-SQL layer set up and this dataset size doesn't warrant one. Bucket
// boundaries are Gregorian (simplest, unambiguous fixed-length days/months)
// while display labels are Jalali, matching this project's existing
// convention. Shared by admin-stats.ts (contract/order trend) and
// log-stats.ts (log event trend) — any caller that needs "N buckets across
// a StatsRange window" uses this instead of re-deriving its own.
export function buildRangeBuckets(range: StatsRange, earliestDate?: Date): RangeBucket[] {
  const now = new Date();

  if (range === "today") {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    return Array.from({ length: 24 }, (_, h) => {
      const start = new Date(dayStart);
      start.setHours(h);
      const end = new Date(start);
      end.setHours(h + 1);
      return { key: start.toISOString().slice(0, 13), label: toPersianDigits(`${String(h).padStart(2, "0")}:00`), start, end };
    });
  }

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (days - 1));
    return Array.from({ length: days }, (_, i) => {
      const start = new Date(dayStart);
      start.setDate(start.getDate() + i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { key: isoDay(start), label: jalaliDayLabel(start), start, end };
    });
  }

  if (range === "1y") {
    // 12 monthly buckets, ending with the current month.
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return Array.from({ length: 12 }, (_, i) => {
      const start = new Date(monthStart.getFullYear(), monthStart.getMonth() + i, 1);
      const end = new Date(monthStart.getFullYear(), monthStart.getMonth() + i + 1, 1);
      const mid = new Date(start.getFullYear(), start.getMonth(), 15);
      const { jm } = toJalaali(mid.getFullYear(), mid.getMonth() + 1, mid.getDate());
      return { key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, label: JALALI_MONTHS[jm - 1], start, end };
    });
  }

  // "all": from the earliest record's month to now. Monthly buckets if the
  // span is <= 2 years; otherwise quarterly (3-month buckets), so a chart
  // covering many years of history doesn't turn into an unreadable wall of bars.
  const earliestMonthStart = earliestDate
    ? new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const spanMonths =
    (now.getFullYear() - earliestMonthStart.getFullYear()) * 12 + (now.getMonth() - earliestMonthStart.getMonth()) + 1;
  const quarterly = spanMonths > 24;
  const step = quarterly ? 3 : 1;
  const bucketCount = Math.max(1, Math.ceil(spanMonths / step));

  return Array.from({ length: bucketCount }, (_, i) => {
    const start = new Date(earliestMonthStart.getFullYear(), earliestMonthStart.getMonth() + i * step, 1);
    const end = new Date(earliestMonthStart.getFullYear(), earliestMonthStart.getMonth() + (i + 1) * step, 1);
    const lastMonthInBucket = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const { jy: jyStart, jm: jmStart } = toJalaali(start.getFullYear(), start.getMonth() + 1, 1);
    const { jy: jyEnd, jm: jmEnd } = toJalaali(lastMonthInBucket.getFullYear(), lastMonthInBucket.getMonth() + 1, 1);
    const yearSuffix = ` ${toPersianDigits(String(jyStart).slice(-2))}`;
    const label =
      jmStart === jmEnd && jyStart === jyEnd
        ? `${JALALI_MONTHS[jmStart - 1]}${yearSuffix}`
        : `${JALALI_MONTHS[jmStart - 1]}–${JALALI_MONTHS[jmEnd - 1]}${yearSuffix}`;
    return { key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, label, start, end };
  });
}
