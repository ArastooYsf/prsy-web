// Isolated on purpose: this constant is imported by both server code
// (storage-usage.ts) and a "use client" component (StorageTrendChart.tsx).
// storage-usage.ts itself imports @/lib/prisma (server-only, pulls in the
// mariadb driver's Node built-ins) — importing that constant directly from
// there previously dragged the whole module, and prisma with it, into the
// client bundle, breaking the browser build. This file has zero other
// imports so it's safe from either side of that boundary.

// The hosting plan's actual per-volume allocation — update this if that plan
// ever changes. Public and private uploads are two separate dedicated
// volumes, each with their own 5GB, not one 10GB pool.
export const DEDICATED_UPLOAD_CAP_BYTES = 5 * 1024 * 1024 * 1024;
