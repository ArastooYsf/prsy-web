// Isolated on purpose: this is imported as a VALUE by "use client" components
// (LogsDashboard.tsx), while lighthouse.ts itself imports fs/promises and
// child_process (server-only) — importing this straight from lighthouse.ts
// previously dragged that whole module into the client bundle, breaking the
// browser build (same issue as storage-caps.ts / StorageTrendChart.tsx).
export type LighthouseStrategy = "mobile" | "desktop";
export const STRATEGY_LABELS_FA: Record<LighthouseStrategy, string> = { mobile: "موبایل", desktop: "دسکتاپ" };
