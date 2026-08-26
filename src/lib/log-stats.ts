import { readLogEntries, type LogFileSummary } from "@/lib/logger";
import { buildRangeBuckets, type StatsRange } from "@/lib/stats-range";
import type { LogCategory } from "@/lib/log-types";

export type CategoryEventStats = {
  today: number;
  last7Days: number;
  last30Days: number;
};

// One point per bucket, one count per requested category — for the unified
// multi-line event trend chart (crash/warning/security/etc. all on one
// axis with a shared time-range filter), replacing what used to be two
// separate single-series 30-day-only charts.
export type CategoryTrendPoint = { key: string; label: string } & Record<LogCategory, number>;

/**
 * Reads every log file (limited to `files` already narrowed by the caller —
 * a lightweight metadata listing is enough, entry content isn't needed) and
 * buckets matching entries by day/month per `buildRangeBuckets(range)`. This
 * is the one place that reads log-entry content for trend/stat purposes;
 * `summarizeCategoryTrend` below derives today/7d/30d totals from its output
 * instead of re-reading the same files a second time.
 */
export async function getLogEventTrend(
  files: Pick<LogFileSummary, "filename" | "category" | "modifiedAt">[],
  range: StatsRange,
  categories: readonly LogCategory[],
): Promise<CategoryTrendPoint[]> {
  const relevant = files.filter((f) => categories.includes(f.category));

  let earliestDate: Date | undefined;
  if (range === "all") {
    const dates = relevant.map((f) => new Date(f.modifiedAt));
    earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : undefined;
  }

  const buckets = buildRangeBuckets(range, earliestDate);
  const windowStart = buckets[0].start;

  // A file whose last write predates the window can't contain any entry
  // inside it — skip reading it at all. The remaining files are independent
  // reads, so they run in parallel rather than one-at-a-time.
  const candidateFiles = relevant.filter((f) => new Date(f.modifiedAt) >= windowStart);
  const entriesByFile = await Promise.all(
    candidateFiles.map(async (f) => ({
      category: f.category,
      // enforceRetention() (triggered by any concurrent logEvent() write)
      // can delete an unlocked file between listLogFiles() handing it to us
      // and this read — treat a vanished file as contributing zero entries
      // rather than throwing and taking down the whole dashboard render.
      entries: await readLogEntries(f.filename).catch(() => []),
    })),
  );

  const points: CategoryTrendPoint[] = buckets.map((b) => {
    const point = { key: b.key, label: b.label } as CategoryTrendPoint;
    for (const c of categories) point[c] = 0;
    return point;
  });

  for (const { category, entries } of entriesByFile) {
    for (const entry of entries) {
      const t = new Date(entry.timestamp);
      const bucketIndex = buckets.findIndex((b) => t >= b.start && t < b.end);
      if (bucketIndex !== -1) points[bucketIndex][category] += 1;
    }
  }

  return points;
}

/**
 * Derives today/7d/30d totals for one or more categories (crash;
 * important+security combined as "warnings"; etc.) from an already-fetched
 * 30-daily-bucket trend — pure aggregation, no I/O of its own. Callers must
 * pass a `trend` built with `getLogEventTrend(files, "30d", ...)` (or any
 * superset of `categories`), since this assumes 30 daily buckets, oldest
 * first, today last.
 */
export function summarizeCategoryTrend(trend: CategoryTrendPoint[], categories: readonly LogCategory[]): CategoryEventStats {
  const perBucketTotals = trend.map((point) => categories.reduce((sum, c) => sum + point[c], 0));
  const today = perBucketTotals[perBucketTotals.length - 1] ?? 0;
  const last7Days = perBucketTotals.slice(-7).reduce((sum, n) => sum + n, 0);
  const last30Days = perBucketTotals.reduce((sum, n) => sum + n, 0);
  return { today, last7Days, last30Days };
}
