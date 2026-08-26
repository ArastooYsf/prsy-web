import { mkdir, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { execFileAsync } from "@/lib/exec-file";

// Same "outside the app's own directory" reasoning as LOG_DIR/UPTIME_DIR —
// score history must survive a redeploy.
const LIGHTHOUSE_DIR = path.join(os.homedir(), ".prsy-website", "lighthouse");
const HISTORY_FILE = path.join(LIGHTHOUSE_DIR, "history.json");
const MAX_HISTORY_ENTRIES = 60;
const MIN_RUN_INTERVAL_MS = 60 * 1000;
const RUN_TIMEOUT_MS = 120 * 1000;

// Matches the exact working invocation already documented in this project's
// CLAUDE.md QA checklist (headless Chromium via CDP, no sandbox).
const CHROME_PATH = process.env.CHROME_PATH ?? "/snap/bin/chromium";
const TARGET_URL = process.env.LIGHTHOUSE_TARGET_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

export type LighthouseRun = { timestamp: string; performanceScore: number };

export async function getLighthouseHistory(): Promise<LighthouseRun[]> {
  try {
    const raw = await readFile(HISTORY_FILE, "utf8");
    return JSON.parse(raw) as LighthouseRun[];
  } catch {
    return [];
  }
}

type LighthouseReport = { categories?: { performance?: { score?: number } } };

/**
 * Runs a real Lighthouse performance audit against this app (desktop
 * preset, performance category only — a full 4-category run is slower and
 * this card only shows Performance) and appends the score to a persisted
 * history file. Never throws: the caller always gets either a run or a
 * user-facing Persian error, since the CLI/Chromium may not be present in
 * every environment this runs in.
 */
let auditInProgress = false;

export async function runLighthouseAudit(): Promise<{ run: LighthouseRun } | { error: string }> {
  // The MIN_RUN_INTERVAL_MS check below only rejects a *second* request once
  // the *first* has already written its history entry — two requests that
  // land within the same in-flight window (a double click, two admin tabs)
  // would both read the same last entry and both pass it. This in-process
  // flag closes that race, but only if it's set *before* the first `await`
  // below — setting it after would leave a yield point where a second
  // request could still see `auditInProgress === false` and slip through.
  if (auditInProgress) {
    return { error: "یک تست سرعت دیگر همین الان در حال اجراست — لطفاً صبر کنید." };
  }
  auditInProgress = true;

  const history = await getLighthouseHistory();
  const last = history[history.length - 1];
  if (last && Date.now() - new Date(last.timestamp).getTime() < MIN_RUN_INTERVAL_MS) {
    auditInProgress = false;
    return { error: "لطفاً کمی صبر کنید — هر یک دقیقه فقط یک‌بار می‌توان تست سرعت را اجرا کرد." };
  }

  await mkdir(LIGHTHOUSE_DIR, { recursive: true });
  const outFile = path.join(LIGHTHOUSE_DIR, `run-${Date.now()}.json`);

  try {
    await execFileAsync(
      "npx",
      [
        "--yes",
        "lighthouse",
        TARGET_URL,
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
        "--only-categories=performance",
        "--preset=desktop",
        "--output=json",
        `--output-path=${outFile}`,
      ],
      { env: { ...process.env, CHROME_PATH }, timeout: RUN_TIMEOUT_MS, maxBuffer: 50 * 1024 * 1024 },
    );

    const raw = await readFile(outFile, "utf8");
    const report = JSON.parse(raw) as LighthouseReport;
    const score = report.categories?.performance?.score;
    if (typeof score !== "number") {
      return { error: "خروجی Lighthouse قابل تفسیر نبود." };
    }

    const run: LighthouseRun = { timestamp: new Date().toISOString(), performanceScore: Math.round(score * 100) };
    const nextHistory = [...history, run].slice(-MAX_HISTORY_ENTRIES);
    await writeFile(HISTORY_FILE, JSON.stringify(nextHistory, null, 2), "utf8");
    return { run };
  } catch (err) {
    console.warn("[lighthouse] audit failed:", err);
    return { error: "اجرای تست سرعت ناموفق بود — ممکن است ابزار Lighthouse یا مرورگر Chromium در این محیط در دسترس نباشد." };
  } finally {
    auditInProgress = false;
    await rm(outFile, { force: true });
  }
}
