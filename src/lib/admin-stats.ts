import { prisma } from "@/lib/prisma";
import { toJalaali } from "jalaali-js";

export type TicketTrendPoint = { date: string; label: string; count: number };
export type StatusCount = { status: string; label: string; count: number };

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل داده‌شده",
  CANCELLED: "لغوشده",
};

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function jalaliDayLabel(date: Date): string {
  const { jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

// Bucketed by calendar day (Gregorian ISO keys, Jalali display labels) —
// buckets computed in JS rather than SQL date-trunc since the app has no
// raw-SQL layer set up and this dataset size doesn't warrant one.
export async function getTicketTrend(days = 30): Promise<TicketTrendPoint[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);

  const tickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: cutoff }, deletedAt: null },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    buckets.set(isoDay(d), 0);
  }
  for (const ticket of tickets) {
    const key = isoDay(ticket.createdAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    label: jalaliDayLabel(new Date(date)),
    count,
  }));
}

export async function getOrderStatusBreakdown(): Promise<StatusCount[]> {
  const groups = await prisma.order.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: true,
  });

  const counts = new Map(groups.map((g) => [g.status, g._count]));
  return Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
    count: counts.get(status as never) ?? 0,
  }));
}

export async function getTicketOpenClosedRatio(): Promise<StatusCount[]> {
  const groups = await prisma.ticket.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: true,
  });

  let open = 0;
  let closed = 0;
  for (const g of groups) {
    if (g.status === "CLOSED") closed += g._count;
    else open += g._count;
  }

  return [
    { status: "OPEN", label: "باز", count: open },
    { status: "CLOSED", label: "بسته‌شده", count: closed },
  ];
}
