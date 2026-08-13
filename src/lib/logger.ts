import { appendFile, mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { toJalaali } from "jalaali-js";

const LOG_DIR = path.join(process.cwd(), "logs");

export type LogAction =
  | "create"
  | "update"
  | "delete"
  | "role_change"
  | "status_change"
  | "approval_change";

export type LogEntry = {
  timestamp: string; // ISO
  actor: { id: string; email: string };
  action: LogAction;
  target: { type: string; id: string };
  summary?: string;
};

function jalaliFilename(date: Date): string {
  const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${jy}-${String(jm).padStart(2, "0")}-${String(jd).padStart(2, "0")}.jsonl`;
}

function lockFilePath(filename: string): string {
  return path.join(LOG_DIR, `${filename}.lock.json`);
}

/**
 * Appends one event to today's (Jalali calendar day) log file, creating it
 * if needed. Never throws — a logging failure must not break the request
 * that triggered it, so errors are swallowed after a console warning.
 */
export async function logEvent(entry: Omit<LogEntry, "timestamp">, options?: { locked?: boolean }): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    const now = new Date();
    const filename = jalaliFilename(now);
    const full: LogEntry = { timestamp: now.toISOString(), ...entry };
    await appendFile(path.join(LOG_DIR, filename), `${JSON.stringify(full)}\n`, "utf8");

    if (options?.locked) {
      await writeFile(lockFilePath(filename), JSON.stringify({ locked: true }), "utf8");
    }
  } catch (err) {
    console.warn("logEvent failed:", err);
  }
}

export type LogFileSummary = {
  filename: string;
  size: number;
  entryCount: number;
  locked: boolean;
  modifiedAt: string;
};

// Only ever reads *.jsonl files from LOG_DIR by exact name — filenames are
// always our own generated `${jalaliDate}.jsonl` pattern, never user input,
// so there's no path-traversal surface here or in readLogFile/isLogFilename.
export async function listLogFiles(): Promise<LogFileSummary[]> {
  await mkdir(LOG_DIR, { recursive: true });
  const entries = await readdir(LOG_DIR);
  const jsonlFiles = entries.filter((f) => f.endsWith(".jsonl"));

  const summaries = await Promise.all(
    jsonlFiles.map(async (filename) => {
      const filePath = path.join(LOG_DIR, filename);
      const [fileStat, content, locked] = await Promise.all([
        stat(filePath),
        readFile(filePath, "utf8"),
        isLogFileLocked(filename),
      ]);
      const entryCount = content.split("\n").filter((line) => line.trim()).length;
      return {
        filename,
        size: fileStat.size,
        entryCount,
        locked,
        modifiedAt: fileStat.mtime.toISOString(),
      };
    }),
  );

  return summaries.sort((a, b) => b.filename.localeCompare(a.filename));
}

export async function isLogFileLocked(filename: string): Promise<boolean> {
  try {
    await stat(lockFilePath(filename));
    return true;
  } catch {
    return false;
  }
}

const LOG_FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}\.jsonl$/;

export function isValidLogFilename(filename: string): boolean {
  return LOG_FILENAME_PATTERN.test(filename);
}

export async function readLogFileRaw(filename: string): Promise<string> {
  if (!isValidLogFilename(filename)) throw new Error("invalid log filename");
  return readFile(path.join(LOG_DIR, filename), "utf8");
}
