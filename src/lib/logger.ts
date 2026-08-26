import { appendFile, mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { toJalaali } from "jalaali-js";
import { formatJalaliDateTime } from "@/lib/jalali";
import {
  ACTION_LABELS_FA,
  CATEGORY_LABELS_FA,
  DAILY_CATEGORIES,
  EVENT_CATEGORIES,
  type LogAction,
  type LogActor,
  type LogCategory,
  type LogEntry,
  type LogTarget,
} from "@/lib/log-types";

// Re-exported so existing server-side imports from "@/lib/logger" keep
// working unchanged — see log-types.ts for why these live in their own
// Node-free module in the first place.
export { ACTION_LABELS_FA, DAILY_CATEGORIES, EVENT_CATEGORIES };
export type { LogAction, LogActor, LogCategory, LogEntry, LogTarget };

// Deliberately OUTSIDE the app's own checked-out directory (process.cwd()):
// a redeploy (fresh checkout, `git clean`, container rebuild) wipes that
// tree, and this data must survive it. Same reasoning that already kept it
// out of /public — that folder is served statically with no auth check, and
// log lines can contain user emails/roles/actions, a leak we can't risk.
// Override with LOG_DIR for a specific deploy (e.g. a mounted persistent
// volume); the default is a dotfolder under the process's home directory —
// a standard place for app data that lives outside the app's own source
// tree. NOTE for later: this whole module is meant to be swapped for a
// client that writes to external log/object storage — this local-disk
// implementation is a placeholder for that, not something to grow.
const LOG_DIR = process.env.LOG_DIR ? path.resolve(process.env.LOG_DIR) : path.join(os.homedir(), ".prsy-website", "logs");

// Adjustable: total size cap for the whole log directory. Once exceeded,
// the oldest *unlocked* files (by actual last-write time, any category) are
// deleted oldest-first until back under the cap. Locked files are never
// touched, no matter how old or how far over the cap that leaves things —
// see enforceRetention below.
export const LOG_DIR_SIZE_CAP_BYTES = 300 * 1024 * 1024; // 300MB

// Two different storage strategies, chosen per category:
//
//  - DAILY categories rotate on a 24h (Jalali calendar day) timer: one file
//    per CATEGORY per day (not one shared file for the whole day — a
//    "general" day and an "important" day are different files), unlocked
//    by default, manually lockable by an admin from the logs page.
//
//  - EVENT categories never rotate on a timer — a file is only created when
//    a real crash/security event actually happens, and it's locked from
//    the moment it's created, unconditionally (see logEvent below; this is
//    enforced in the write path itself, not left to a UI default). Events
//    that land close together in time reuse the same file instead of each
//    getting its own (see EVENT_GROUPING_WINDOW_MS) — otherwise a burst
//    (the same crash repeating, or an attack in progress) would spam the
//    disk with hundreds of one-line files.
//
// "access" (دسترسی) is split out of "security": routine, high-volume,
// low-severity access-control noise (a mistyped password) versus a rare,
// high-severity security incident (an account actually getting locked out,
// a forged/failed bot-check, a real unauthorized-access attempt) — these
// deserve different retention policies, which is exactly what per-category
// files make possible. "notification" is kept from the previous design
// (delivery success/failure of outbound notifications) since it already had
// a real producer (src/lib/notifications/events.ts) and dropping it would
// lose that granularity for no reason.
//
// The categories/actions/entry shape themselves live in @/lib/log-types
// (imported above), not here — that module has no Node-only imports, so
// client components can pull in things like ACTION_LABELS_FA without
// dragging this file's fs/promises-based implementation into the browser
// bundle.

function isEventCategory(category: LogCategory): boolean {
  return (EVENT_CATEGORIES as readonly string[]).includes(category);
}

// How close together (by the target file's last-write time) two crash/security
// events have to be to share one file instead of each getting its own.
const EVENT_GROUPING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// A caller can always pass an explicit `category`; this is only the default
// when they don't (the existing admin CRUD call sites don't, so this alone
// upgrades their categorization — no call-site changes needed).
const ACTION_DEFAULT_CATEGORY: Partial<Record<LogAction, LogCategory>> = {
  delete: "important",
  role_change: "important",
  approval_change: "important",
  login_failed: "access",
  unauthorized_access: "security",
  crash: "crash",
  notification_sent: "notification",
  notification_failed: "notification",
};

export function actorFromSession(session: {
  user: { id: string; name?: string | null; email?: string | null; role: string };
}): LogActor {
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

function jalaliDatePart(date: Date): string {
  const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${jy}-${String(jm).padStart(2, "0")}-${String(jd).padStart(2, "0")}`;
}

function dailyFilename(category: LogCategory, date: Date): string {
  return `${category}-${jalaliDatePart(date)}.log`;
}

function eventTimestampPart(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${jalaliDatePart(date)}T${hh}-${mm}-${ss}`;
}

function newEventFilename(category: LogCategory, date: Date): string {
  return `${category}-${eventTimestampPart(date)}.log`;
}

function lockFilePath(filename: string): string {
  return path.join(LOG_DIR, `${filename}.lock.json`);
}

const DAILY_FILENAME_PATTERN = /^(general|important|access|notification)-\d{4}-\d{2}-\d{2}\.log$/;
const EVENT_FILENAME_PATTERN = /^(crash|security)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.log$/;

// Only ever reads files from LOG_DIR by exact name, and the name is always
// either one we generated ourselves or validated against these patterns
// before use — no path-traversal surface anywhere in this module.
export function isValidLogFilename(filename: string): boolean {
  return DAILY_FILENAME_PATTERN.test(filename) || EVENT_FILENAME_PATTERN.test(filename);
}

// Category now lives in the filename itself (one category per file, by
// design), so listing files no longer has to read+parse every one just to
// know what's in it.
export function categoryFromFilename(filename: string): LogCategory | null {
  const match = filename.match(/^([a-z]+)-/);
  const prefix = match?.[1];
  if (!prefix) return null;
  if ((DAILY_CATEGORIES as readonly string[]).includes(prefix)) return prefix as LogCategory;
  if ((EVENT_CATEGORIES as readonly string[]).includes(prefix)) return prefix as LogCategory;
  return null;
}

// Picks which file a new crash/security event should append to: the most
// recent file for that category if it was last written within the grouping
// window, otherwise a brand-new one. Sliding window (measured from the
// target file's last write, not its creation) so a burst of related events
// keeps extending the same file for as long as they keep coming close
// together, and only a real gap starts a new one.
async function resolveEventFilename(category: LogCategory, now: Date): Promise<string> {
  const prefix = `${category}-`;
  const entries = await readdir(LOG_DIR).catch(() => [] as string[]);
  const candidates = entries.filter((f) => f.startsWith(prefix) && EVENT_FILENAME_PATTERN.test(f)).sort();
  const latest = candidates[candidates.length - 1];
  if (!latest) return newEventFilename(category, now);

  const latestStat = await stat(path.join(LOG_DIR, latest)).catch(() => null);
  if (latestStat && now.getTime() - latestStat.mtime.getTime() <= EVENT_GROUPING_WINDOW_MS) {
    return latest;
  }
  return newEventFilename(category, now);
}

/**
 * Appends one event to the right log file for its category, creating that
 * file if needed.
 *  - general/important/access/notification: one file per category per
 *    Jalali calendar day, unlocked unless `options.locked` is passed.
 *  - crash/security: one file per burst of nearby events (see
 *    resolveEventFilename), locked unconditionally — `options.locked` can't
 *    turn this off, by design.
 * Never throws: a logging failure must not break the request that
 * triggered it, so errors are swallowed after a console warning.
 */
export async function logEvent(
  entry: Omit<LogEntry, "timestamp" | "category"> & { category?: LogCategory },
  options?: { locked?: boolean },
): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    const now = new Date();
    const category = entry.category ?? ACTION_DEFAULT_CATEGORY[entry.action] ?? "general";
    const full: LogEntry = { ...entry, timestamp: now.toISOString(), category };

    const eventDriven = isEventCategory(category);
    const filename = eventDriven ? await resolveEventFilename(category, now) : dailyFilename(category, now);

    await appendFile(path.join(LOG_DIR, filename), `${JSON.stringify(full)}\n`, "utf8");

    // crash/security files are ALWAYS locked, unconditionally — not just
    // "locked unless told otherwise". Re-locking an already-locked file is
    // a harmless no-op (rewrites the same sidecar), so this line alone is
    // the whole guarantee, independent of whatever `options.locked` says.
    if (eventDriven || options?.locked) {
      await setLogFileLocked(filename, true);
    }

    await enforceRetention();
  } catch (err) {
    console.warn("logEvent failed:", err);
  }
}

export async function isLogFileLocked(filename: string): Promise<boolean> {
  try {
    await stat(lockFilePath(filename));
    return true;
  } catch {
    return false;
  }
}

export async function setLogFileLocked(filename: string, locked: boolean): Promise<void> {
  if (!isValidLogFilename(filename)) throw new Error("invalid log filename");
  await mkdir(LOG_DIR, { recursive: true });
  const lockPath = lockFilePath(filename);
  if (locked) {
    await writeFile(lockPath, JSON.stringify({ locked: true, lockedAt: new Date().toISOString() }), "utf8");
  } else {
    await rm(lockPath, { force: true });
  }
}

type RawFileStat = { filename: string; size: number; mtime: string; locked: boolean };

async function statAllLogFiles(): Promise<RawFileStat[]> {
  await mkdir(LOG_DIR, { recursive: true });
  const entries = await readdir(LOG_DIR);
  const logFiles = entries.filter((f) => isValidLogFilename(f));

  return Promise.all(
    logFiles.map(async (filename) => {
      const fileStat = await stat(path.join(LOG_DIR, filename));
      const locked = await isLogFileLocked(filename);
      return { filename, size: fileStat.size, mtime: fileStat.mtime.toISOString(), locked };
    }),
  );
}

/**
 * If the log directory exceeds LOG_DIR_SIZE_CAP_BYTES, deletes the oldest
 * *unlocked* files (by real last-write time — filenames no longer share one
 * sortable shape now that each category has its own prefix) until back
 * under the cap.
 *
 * Locked files (including the always-locked crash/security ones) are never
 * deleted, full stop — this is the one and only place this module deletes a
 * log file, and every deletion here re-checks `f.locked` immediately before
 * the `rm` call, so there is no code path, automatic or manual, that can
 * remove a locked file. If only locked files remain, the cap can stay
 * exceeded indefinitely — that is the intended trade-off, not a bug.
 */
export async function enforceRetention(capBytes: number = LOG_DIR_SIZE_CAP_BYTES): Promise<string[]> {
  const files = await statAllLogFiles();
  let total = files.reduce((sum, f) => sum + f.size, 0);
  if (total <= capBytes) return [];

  const oldestFirst = [...files].sort((a, b) => a.mtime.localeCompare(b.mtime));
  const deleted: string[] = [];

  for (const f of oldestFirst) {
    if (total <= capBytes) break;
    if (f.locked) continue;
    await rm(path.join(LOG_DIR, f.filename), { force: true });
    total -= f.size;
    deleted.push(f.filename);
  }

  return deleted;
}

export async function readLogEntries(filename: string): Promise<LogEntry[]> {
  if (!isValidLogFilename(filename)) throw new Error("invalid log filename");
  const raw = await readFile(path.join(LOG_DIR, filename), "utf8");
  const entries: LogEntry[] = [];

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as LogEntry);
    } catch {
      // skip a malformed line rather than fail the whole file
    }
  }

  return entries;
}

export type LogFileSummary = {
  filename: string;
  category: LogCategory;
  size: number;
  entryCount: number;
  locked: boolean;
  modifiedAt: string;
};

/**
 * Filenames only, for one or more categories (or "all") — stops at
 * statAllLogFiles()'s stat+lock-check pass and never reads a file's
 * content, unlike listLogFiles() (which reads every file just to compute
 * entryCount for the file-list UI). For a caller that only needs "which
 * files am I about to zip", that per-file content read would be pure waste,
 * doubled again once the export itself reads each file for real.
 */
export async function listLogFilenames(category: LogCategory[] | "all"): Promise<string[]> {
  const base = await statAllLogFiles();
  return base
    .filter((f) => category === "all" || category.includes(categoryFromFilename(f.filename) as LogCategory))
    .map((f) => f.filename);
}

export type LogFileMetaSummary = { filename: string; category: LogCategory; modifiedAt: string };

/**
 * Same "stat-only, no content read" shape as listLogFilenames, but keeps
 * category/modifiedAt per file instead of flattening to bare filenames — for
 * callers (the trend chart's range-refetch endpoint) that need to filter by
 * category/window before reading, but have no use for entryCount/size/locked.
 */
export async function listLogFileMetas(): Promise<LogFileMetaSummary[]> {
  const base = await statAllLogFiles();
  return base
    .map(({ filename, mtime }) => ({ filename, category: categoryFromFilename(filename), modifiedAt: mtime }))
    .filter((f): f is LogFileMetaSummary => f.category !== null);
}

export async function listLogFiles(): Promise<LogFileSummary[]> {
  const base = await statAllLogFiles();

  const summaries = await Promise.all(
    base.map(async ({ filename, size, mtime, locked }) => {
      const entries = await readLogEntries(filename);
      const category = categoryFromFilename(filename) ?? "general";
      return { filename, category, size, entryCount: entries.length, locked, modifiedAt: mtime };
    }),
  );

  return summaries.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

export type LogFileMeta = Omit<LogFileSummary, "filename" | "entryCount">;

/**
 * Metadata for exactly one file (category/size/locked/modifiedAt), without
 * the listLogFiles() cost of statting and reading every other file in the
 * directory — for the detail page, which already reads this file's entries
 * itself and only needs its own stats alongside them.
 */
export async function getLogFileMeta(filename: string): Promise<LogFileMeta | null> {
  if (!isValidLogFilename(filename)) return null;
  try {
    const fileStat = await stat(path.join(LOG_DIR, filename));
    const locked = await isLogFileLocked(filename);
    const category = categoryFromFilename(filename) ?? "general";
    return { category, size: fileStat.size, locked, modifiedAt: fileStat.mtime.toISOString() };
  } catch {
    return null;
  }
}


const CSV_COLUMNS = ["زمان", "دسته", "نوع عملیات", "کاربر انجام‌دهنده", "ایمیل کاربر", "نقش کاربر", "موجودیت هدف", "نوع موجودیت", "آدرس IP", "User Agent", "توضیحات"];

// A cell starting with =, +, -, @, or a tab/CR can be read as a formula by
// Excel/LibreOffice/Sheets on open (CSV/DDE injection) — several fields here
// (actor name, target label, summary) can hold user-supplied text (e.g. a
// customer's ticket subject), not just values this app generated itself.
const FORMULA_INJECTION_PREFIX = /^[=+\-@\t\r]/;

// A field needs quoting the moment it could be misread as more than one
// field or run past its own line — a bare comma or newline would otherwise
// silently shift every later column.
function csvField(value: string): string {
  const safe = FORMULA_INJECTION_PREFIX.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function logEntryToCsvRow(entry: LogEntry): string {
  return [
    formatJalaliDateTime(entry.timestamp),
    CATEGORY_LABELS_FA[entry.category] ?? entry.category,
    ACTION_LABELS_FA[entry.action] ?? entry.action,
    entry.actor.name || "کاربر ناشناس",
    entry.actor.email,
    entry.actor.role,
    entry.target.label,
    entry.target.type,
    entry.ip ?? "",
    entry.userAgent ?? "",
    entry.summary ?? "",
  ]
    .map(csvField)
    .join(",");
}

/**
 * Same content as formatLogFileAsText, but as a proper column-per-field CSV
 * (for the ZIP export) instead of one free-text sentence per line — a
 * spreadsheet needs real columns, not prose to re-parse. Leads with a UTF-8
 * BOM so Excel opens the Persian text as UTF-8 instead of guessing a
 * Windows-1256-style legacy codepage and mangling it.
 */
export async function formatLogFileAsCsv(filename: string): Promise<string> {
  const entries = await readLogEntries(filename);
  const header = CSV_COLUMNS.join(",");
  const rows = entries.map(logEntryToCsvRow);
  return `﻿${[header, ...rows].join("\r\n")}\r\n`;
}
