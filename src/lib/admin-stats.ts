import { prisma } from "@/lib/prisma";
import { toJalaali } from "jalaali-js";
import { JALALI_MONTHS, toPersianDigits } from "@/lib/jalali";
import type { StatsRange } from "@/lib/stats-range";
import { TICKET_STATUS, ORDER_STATUS } from "@/lib/status-labels";

export type { StatsRange } from "@/lib/stats-range";
export type StatusCount = { status: string; label: string; count: number };
export type TrendPoint = { key: string; label: string; contracts: number; orders: number };

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function jalaliDayLabel(date: Date): string {
  const { jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

type Bucket = { key: string; label: string; start: Date; end: Date };

// Buckets computed in JS rather than SQL date-trunc since the app has no
// raw-SQL layer set up and this dataset size doesn't warrant one. Bucket
// boundaries are Gregorian (simplest, unambiguous fixed-length days/months)
// while display labels are Jalali, matching this file's existing convention.
export function buildRangeBuckets(range: StatsRange, earliestDate?: Date): Bucket[] {
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

export async function getContractOrderTrend(range: StatsRange): Promise<TrendPoint[]> {
  let earliestDate: Date | undefined;
  if (range === "all") {
    const [firstContract, firstOrder] = await Promise.all([
      prisma.contract.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
      prisma.order.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);
    const dates = [firstContract?.createdAt, firstOrder?.createdAt].filter((d): d is Date => !!d);
    earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : undefined;
  }

  const buckets = buildRangeBuckets(range, earliestDate);
  const from = buckets[0].start;

  const [contracts, orders] = await Promise.all([
    prisma.contract.findMany({ where: { createdAt: { gte: from }, deletedAt: null }, select: { createdAt: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: from }, deletedAt: null }, select: { createdAt: true } }),
  ]);

  return buckets.map((b) => ({
    key: b.key,
    label: b.label,
    contracts: contracts.filter((c) => c.createdAt >= b.start && c.createdAt < b.end).length,
    orders: orders.filter((o) => o.createdAt >= b.start && o.createdAt < b.end).length,
  }));
}

export async function getPageViewCount(range: StatsRange): Promise<number> {
  if (range === "all") {
    return prisma.pageView.count();
  }
  const buckets = buildRangeBuckets(range);
  return prisma.pageView.count({ where: { createdAt: { gte: buckets[0].start } } });
}

export async function getOrderStatusBreakdown(): Promise<StatusCount[]> {
  const groups = await prisma.order.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: true,
  });

  const counts = new Map(groups.map((g) => [g.status, g._count]));
  return Object.entries(ORDER_STATUS).map(([status, { label }]) => ({
    status,
    label,
    count: counts.get(status as never) ?? 0,
  }));
}

export async function getTicketStatusBreakdown(): Promise<StatusCount[]> {
  const groups = await prisma.ticket.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: true,
  });

  const counts = new Map(groups.map((g) => [g.status, g._count]));
  return Object.entries(TICKET_STATUS).map(([status, { label }]) => ({
    status,
    label,
    count: counts.get(status as never) ?? 0,
  }));
}
