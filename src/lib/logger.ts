import { appendFile, mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { toJalaali } from "jalaali-js";
import { formatJalaliDateTime } from "@/lib/jalali";

// Deliberately NOT under /public: that folder is served statically without
// any auth check, and log lines can contain user emails/roles/actions — a
// leak we can't risk. Deliberately NOT under /src either, since that's
// wiped/replaced on every deploy. This sits at the project root next to
// /public, on the same local disk the media uploads currently use, so it
// has the same durability characteristics as uploads today. If uploads ever
// move to external object storage, this should move alongside them.
const LOG_DIR = path.join(process.cwd(), "logs");

// Adjustable: total size cap for the whole logs/ directory. Once exceeded,
// the oldest *unlocked* daily files are deleted (oldest first) until back
// under the cap. Locked files are never touched, no matter how old.
export const LOG_DIR_SIZE_CAP_BYTES = 300 * 1024 * 1024; // 300MB

export type LogCategory = "general" | "crash" | "security" | "notification";

export type LogAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "approval_change"
  | "role_change"
  | "login_failed"
  | "unauthorized_access"
  | "crash"
  | "notification_sent"
  | "notification_failed";

export type LogActor = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export type LogTarget = {
  type: string;
  id: string;
  /** Human-readable label, e.g. «تیکت «سوال درباره گارانتی»» — never just a raw id. */
  label: string;
};

export type LogEntry = {
  timestamp: string; // ISO
  category: LogCategory;
  actor: LogActor;
  action: LogAction;
  target: LogTarget;
  /** Extra detail beyond the verb, e.g. "از «باز» به «بسته‌شده»". */
  summary?: string;
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

function jalaliFilename(date: Date): string {
  const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${jy}-${String(jm).padStart(2, "0")}-${String(jd).padStart(2, "0")}.log`;
}

function lockFilePath(filename: string): string {
  return path.join(LOG_DIR, `${filename}.lock.json`);
}

const LOG_FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}\.log$/;

// Only ever reads files from LOG_DIR by exact name, and the name is always
// either our own generated `${jalaliDate}.log` or validated against this
// pattern before use — no path-traversal surface anywhere in this module.
export function isValidLogFilename(filename: string): boolean {
  return LOG_FILENAME_PATTERN.test(filename);
}

/**
 * Appends one event to today's (Jalali calendar day) log file, creating it
 * if needed — one file per day, every event of that day appended to it.
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
    const filename = jalaliFilename(now);
    const category = entry.category ?? "general";
    const full: LogEntry = { ...entry, timestamp: now.toISOString(), category };
    await appendFile(path.join(LOG_DIR, filename), `${JSON.stringify(full)}\n`, "utf8");

    // crash/security events matter more than general ones — the whole day's
    // file gets locked automatically so cleanup can never sweep it away.
    // An admin can still unlock it by hand from the logs page.
    if (options?.locked || category === "crash" || category === "security") {
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
 * If the logs/ directory exceeds LOG_DIR_SIZE_CAP_BYTES, deletes the oldest
 * *unlocked* daily files (oldest Jalali date first — filenames sort
 * lexicographically since they're zero-padded YYYY-MM-DD) until back under
 * the cap. Locked files (including auto-locked crash/security days) are
 * never deleted, so if only-locked files remain the cap can stay exceeded.
 */
export async function enforceRetention(capBytes: number = LOG_DIR_SIZE_CAP_BYTES): Promise<string[]> {
  const files = await statAllLogFiles();
  let total = files.reduce((sum, f) => sum + f.size, 0);
  if (total <= capBytes) return [];

  const oldestFirst = [...files].sort((a, b) => a.filename.localeCompare(b.filename));
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
  size: number;
  entryCount: number;
  locked: boolean;
  modifiedAt: string;
  categories: LogCategory[];
};

export async function listLogFiles(): Promise<LogFileSummary[]> {
  const base = await statAllLogFiles();

  const summaries = await Promise.all(
    base.map(async ({ filename, size, mtime, locked }) => {
      const entries = await readLogEntries(filename);
      const categories = Array.from(new Set(entries.map((e) => e.category ?? "general"))) as LogCategory[];
      return { filename, size, entryCount: entries.length, locked, modifiedAt: mtime, categories };
    }),
  );

  return summaries.sort((a, b) => b.filename.localeCompare(a.filename));
}

const ACTION_LABELS_FA: Record<LogAction, string> = {
  create: "ایجاد کرد",
  update: "ویرایش کرد",
  delete: "حذف کرد",
  status_change: "تغییر وضعیت داد",
  approval_change: "وضعیت تأیید را تغییر داد",
  role_change: "نقش را تغییر داد",
  login_failed: "تلاش ورود ناموفق داشت",
  unauthorized_access: "تلاش دسترسی غیرمجاز انجام داد",
  crash: "با خطای سیستمی مواجه شد",
  notification_sent: "اعلان ارسال کرد",
  notification_failed: "ارسال اعلان ناموفق بود",
};

export function formatLogEntryHuman(entry: LogEntry): string {
  const dateTimeStr = formatJalaliDateTime(entry.timestamp);
  const actorName = entry.actor.name || entry.actor.email || "کاربر ناشناس";
  const actorLabel = `${actorName} (${entry.actor.role})`;
  const verb = ACTION_LABELS_FA[entry.action] ?? entry.action;
  const detail = entry.summary ? ` — ${entry.summary}` : "";
  return `${dateTimeStr} — ${actorLabel} ${entry.target.label} را ${verb}${detail}`;
}

export async function formatLogFileAsText(filename: string): Promise<string> {
  const entries = await readLogEntries(filename);
  if (entries.length === 0) return "این فایل روزانه هیچ رویدادی ندارد.\n";
  return entries.map(formatLogEntryHuman).join("\n") + "\n";
}
