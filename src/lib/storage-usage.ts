import { readdir, stat } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { formatJalali } from "@/lib/jalali";
import { PRIVATE_DIR, resolvePrivateFilePath } from "@/lib/storage/private";
import { DEDICATED_UPLOAD_CAP_BYTES } from "@/lib/storage-caps";

export { DEDICATED_UPLOAD_CAP_BYTES };

// Must match the two pieces baked into src/lib/storage/public.ts (public/media)
// and src/app/api/media/upload/route.ts (the "uploads" subdir) — there's no
// single exported constant for the combined path today.
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), "public", "media", "uploads");

async function walkDirSize(dir: string): Promise<number> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0; // doesn't exist yet — nothing uploaded, not an error
  }

  let total = 0;
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await walkDirSize(full);
    } else if (entry.isFile()) {
      const s = await stat(full).catch(() => null);
      if (s) total += s.size;
    }
  }
  return total;
}

// Matches resolvePrivateFilePath's own legacy-shape check: a bare "<uuid>.ext"
// lives under PRIVATE_DIR. A "<subdir>/<uuid>.ext" (every private file
// created before that table/directory split existed) resolves read-only
// against public/media/<subdir> instead — but that subdir varies by era
// (ticket attachments used "ticket-attachments/", others used "uploads/", ...),
// so only the "uploads/" ones actually land inside PUBLIC_UPLOADS_DIR, the
// one directory this report walks. Anything else legacy is real disk usage
// somewhere, but outside the two volumes this report measures, so it's left
// out of both breakdowns rather than being misattributed to either.
type VolumeBucket = "private" | "publicUploads" | "other";
function classifyPrivateKey(key: string): VolumeBucket {
  if (!key.includes("/")) return "private";
  return key.startsWith("uploads/") ? "publicUploads" : "other";
}

type VolumeSplit = { inPrivateDir: number; inPublicUploadsDir: number };

// Resolves each stored key/URL against the private-storage path convention
// and stats it, split by which of the two measured volumes it's actually in
// — used for User.avatarUrl/Contract.fileUrl, which (unlike
// CustomerFile/TicketAttachment) have no `size` column to sum instead.
async function sumStatSizesByVolume(keys: string[]): Promise<VolumeSplit> {
  const split: VolumeSplit = { inPrivateDir: 0, inPublicUploadsDir: 0 };
  const results = await Promise.all(
    keys.map(async (key) => {
      const bucket = classifyPrivateKey(key);
      if (bucket === "other") return null;
      const s = await stat(resolvePrivateFilePath(key)).catch(() => null);
      return s ? { bucket, size: s.size } : null;
    }),
  );
  for (const r of results) {
    if (!r) continue;
    if (r.bucket === "private") split.inPrivateDir += r.size;
    else split.inPublicUploadsDir += r.size;
  }
  return split;
}

// CustomerFile/TicketAttachment already carry a trustworthy `size` column, so
// no stat() is needed — just split their DB-recorded sizes by volume (see
// classifyPrivateKey above).
function sumSizesByVolume(rows: { url: string; size: number }[]): VolumeSplit {
  const split: VolumeSplit = { inPrivateDir: 0, inPublicUploadsDir: 0 };
  for (const row of rows) {
    const bucket = classifyPrivateKey(row.url);
    if (bucket === "private") split.inPrivateDir += row.size;
    else if (bucket === "publicUploads") split.inPublicUploadsDir += row.size;
  }
  return split;
}

export type StorageBreakdownEntry = { label: string; bytes: number };

export type StorageVolumeUsage = {
  label: string;
  usedBytes: number;
  capBytes: number;
  breakdown: StorageBreakdownEntry[];
};

export type StorageUsageReport = {
  public: StorageVolumeUsage;
  private: StorageVolumeUsage;
};

/**
 * Real, on-disk usage for the two dedicated upload volumes — replaces the old
 * fs.statfs-based bar, whose "% of the shared server disk" number never
 * reflected this site's actual dedicated allocation. Everything here is a
 * real directory walk / real row sum, not a filesystem-wide capacity read.
 *
 * ponytail: walks the full directory tree on every call — fine at this
 * site's current file counts (checked against the live dev DB: sub-second).
 * If upload volume grows enough for this to matter, cache/memoize with a
 * short TTL rather than switching to the (stale-by-design) daily snapshot
 * for the live bars.
 */
export async function getStorageUsageReport(): Promise<StorageUsageReport> {
  const [publicDirBytes, privateDirBytes, mediaByScope, customerFiles, ticketAttachments, avatarUrls, contractFileUrls] =
    await Promise.all([
      walkDirSize(PUBLIC_UPLOADS_DIR),
      walkDirSize(PRIVATE_DIR),
      prisma.mediaAsset.groupBy({ by: ["scope"], _sum: { size: true } }),
      prisma.customerFile.findMany({ select: { url: true, size: true } }),
      prisma.ticketAttachment.findMany({ select: { url: true, size: true } }),
      prisma.user.findMany({ where: { avatarUrl: { not: null } }, select: { avatarUrl: true } }),
      prisma.contract.findMany({ where: { fileUrl: { not: null } }, select: { fileUrl: true } }),
    ]);

  const scopeBytes = (scope: string) => mediaByScope.find((r) => r.scope === scope)?._sum.size ?? 0;
  const siteContentBytes = scopeBytes("SITE_CONTENT");
  const productCommentBytes = scopeBytes("PRODUCT_COMMENT");
  // Legacy MediaAsset rows from before private uploads split off into their
  // own table (see src/app/api/uploads/private) — no current upload path
  // creates these, but old rows/files may still exist. MediaAsset was always
  // public-storage only, so no legacy-volume split needed here.
  const legacyMediaBytes = mediaByScope
    .filter((r) => r.scope !== "SITE_CONTENT" && r.scope !== "PRODUCT_COMMENT")
    .reduce((sum, r) => sum + (r._sum.size ?? 0), 0);

  // Each of these four private-scoped categories may have some of its bytes
  // sitting in either volume — split every one by where its file actually
  // is, not by what it represents, so each volume's total genuinely
  // reconciles with what's on that volume's disk.
  const customerFileSplit = sumSizesByVolume(customerFiles);
  const ticketAttachmentSplit = sumSizesByVolume(ticketAttachments);
  const [avatarSplit, contractSplit] = await Promise.all([
    sumStatSizesByVolume(avatarUrls.map((u) => u.avatarUrl!)),
    sumStatSizesByVolume(contractFileUrls.map((c) => c.fileUrl!)),
  ]);

  const legacyPrivateInPublicDir =
    customerFileSplit.inPublicUploadsDir +
    ticketAttachmentSplit.inPublicUploadsDir +
    avatarSplit.inPublicUploadsDir +
    contractSplit.inPublicUploadsDir;

  // "Other" is clamped to >=0, never negative — but the reverse (attributed
  // legitimately exceeding the walked total) can happen and is left as-is
  // rather than papered over: e.g. two TicketAttachment rows can reference
  // the same underlying file (found in the live dev DB while building this),
  // so a DB-side sum can double-count a physical file the walk only counts
  // once. The category breakdown is a best-effort "why is it full" diagnostic
  // from DB records, not a guaranteed-exact partition of the walked bytes.
  const publicAttributed = siteContentBytes + productCommentBytes + legacyMediaBytes + legacyPrivateInPublicDir;
  const publicOther = Math.max(0, publicDirBytes - publicAttributed);

  const privateAttributed =
    customerFileSplit.inPrivateDir + ticketAttachmentSplit.inPrivateDir + avatarSplit.inPrivateDir + contractSplit.inPrivateDir;
  const privateOther = Math.max(0, privateDirBytes - privateAttributed);

  return {
    public: {
      label: "آپلودهای عمومی",
      usedBytes: publicDirBytes,
      capBytes: DEDICATED_UPLOAD_CAP_BYTES,
      breakdown: [
        { label: "محتوای سایت (تصاویر محصول، لوگو، وبلاگ، ...)", bytes: siteContentBytes },
        { label: "تصویر دیدگاه محصول", bytes: productCommentBytes },
        ...(legacyMediaBytes > 0 ? [{ label: "قدیمی (پیش از تفکیک آپلود خصوصی)", bytes: legacyMediaBytes }] : []),
        ...(legacyPrivateInPublicDir > 0
          ? [{ label: "فایل خصوصی قدیمی (مشتری/تیکت/آواتار/قرارداد از قبل تفکیک)", bytes: legacyPrivateInPublicDir }]
          : []),
        { label: "سایر / نامشخص", bytes: publicOther },
      ],
    },
    private: {
      label: "آپلودهای خصوصی",
      usedBytes: privateDirBytes,
      capBytes: DEDICATED_UPLOAD_CAP_BYTES,
      breakdown: [
        { label: "فایل مشتری", bytes: customerFileSplit.inPrivateDir },
        { label: "پیوست تیکت", bytes: ticketAttachmentSplit.inPrivateDir },
        { label: "آواتار پروفایل", bytes: avatarSplit.inPrivateDir },
        { label: "فایل قرارداد", bytes: contractSplit.inPrivateDir },
        { label: "سایر / نامشخص", bytes: privateOther },
      ],
    },
  };
}

const SNAPSHOT_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Lazily records one StorageSnapshot row per day — called on an admin's
 * visit to the logs page rather than needing a cron job. Cheap when it's a
 * no-op (one indexed findFirst), and the directory-walk numbers are already
 * in hand from getStorageUsageReport() so this never re-walks anything.
 *
 * ponytail: check-then-act race — two admins (or tabs) hitting this within
 * the same instant right as the 24h window lapses could both insert a row,
 * showing two near-identical points on the trend chart for one day. Only
 * ADMINs reach this page and it's a cosmetic duplicate, not corrupted data;
 * a unique constraint on a date-truncated column would close it if it ever
 * actually happens.
 */
export async function maybeTakeStorageSnapshot(report: StorageUsageReport): Promise<void> {
  const latest = await prisma.storageSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  if (latest && Date.now() - latest.createdAt.getTime() < SNAPSHOT_INTERVAL_MS) return;

  await prisma.storageSnapshot.create({
    data: {
      publicUsedBytes: BigInt(report.public.usedBytes),
      privateUsedBytes: BigInt(report.private.usedBytes),
    },
  });
}

export type StorageTrendPoint = { label: string; publicBytes: number; privateBytes: number };

export async function getStorageTrend(days = 60): Promise<StorageTrendPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const snapshots = await prisma.storageSnapshot.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });

  return snapshots.map((s) => ({
    label: formatJalali(s.createdAt),
    publicBytes: Number(s.publicUsedBytes),
    privateBytes: Number(s.privateUsedBytes),
  }));
}
