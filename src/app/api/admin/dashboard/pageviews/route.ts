import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPageViewCount, type StatsRange } from "@/lib/admin-stats";

const VALID_RANGES: StatsRange[] = ["today", "7d", "30d", "1y", "all"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range");
  const range: StatsRange = VALID_RANGES.includes(rangeParam as StatsRange) ? (rangeParam as StatsRange) : "30d";

  const count = await getPageViewCount(range);
  return NextResponse.json({ count });
}
