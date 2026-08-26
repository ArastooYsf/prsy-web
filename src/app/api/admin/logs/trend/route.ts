import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listLogFileMetas } from "@/lib/logger";
import { getLogEventTrend } from "@/lib/log-stats";
import { ALL_LOG_CATEGORIES } from "@/lib/log-types";
import { ALL_STATS_RANGES, type StatsRange } from "@/lib/stats-range";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range");
  const range: StatsRange = (ALL_STATS_RANGES as string[]).includes(rangeParam ?? "") ? (rangeParam as StatsRange) : "30d";

  // Metadata-only listing — this route never needs entryCount/size/locked,
  // and re-reading every log file's full content on every range-filter
  // click (listLogFiles()) would be pure waste.
  const files = await listLogFileMetas();
  const data = await getLogEventTrend(files, range, ALL_LOG_CATEGORIES);
  return NextResponse.json({ data });
}
