import { prisma } from "@/lib/prisma";
import { buildRangeBuckets, type StatsRange } from "@/lib/stats-range";
import { TICKET_STATUS, ORDER_STATUS } from "@/lib/status-labels";

export type { StatsRange } from "@/lib/stats-range";
export type StatusCount = { status: string; label: string; count: number };
export type TrendPoint = { key: string; label: string; contracts: number; orders: number };

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
