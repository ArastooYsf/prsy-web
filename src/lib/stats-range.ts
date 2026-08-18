// Split out from admin-stats.ts so client components can import the range
// type/labels without pulling in that file's `import { prisma }` — prisma's
// mariadb driver is Node-only (uses `fs`) and breaks the client bundle.
export type StatsRange = "today" | "7d" | "30d" | "1y";

export const RANGE_LABELS: Record<StatsRange, string> = {
  today: "امروز",
  "7d": "۷ روز اخیر",
  "30d": "۱ ماه اخیر",
  "1y": "۱ سال اخیر",
};
