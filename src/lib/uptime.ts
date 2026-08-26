import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { toPersianDigits } from "@/lib/format-number";
import { isoDay, jalaliDayLabel } from "@/lib/stats-range";

// Same "outside the app's own checked-out directory" reasoning as LOG_DIR in
// logger.ts — a redeploy must not reset uptime history. Sibling directory,
// not a subfolder of LOG_DIR, since heartbeats aren't log events.
const UPTIME_DIR = path.join(os.homedir(), ".prsy-website", "uptime");
const HEARTBEAT_FILE = path.join(UPTIME_DIR, "heartbeats.jsonl");
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const DAY_MS = 24 * 60 * 60 * 1000;

// A heartbeat gap wider than this counts as downtime — 3x the interval
// tolerates one missed beat (a slow tick, a GC pause) without flagging it.
const DOWNTIME_GAP_MS = HEARTBEAT_INTERVAL_MS * 3;

// This module's first import approximates "server process start" — the
// simple option the request explicitly allowed. `globalThis` guards against
// Next.js dev-mode hot-reload re-importing this module and resetting the
// clock / doubling the heartbeat timer on every save.
const globalForUptime = globalThis as unknown as {
  __prsyUptimeStartedAt?: number;
  __prsyUptimeTimer?: ReturnType<typeof setInterval>;
};

if (!globalForUptime.__prsyUptimeStartedAt) {
  globalForUptime.__prsyUptimeStartedAt = Date.now();
}

export const PROCESS_STARTED_AT = globalForUptime.__prsyUptimeStartedAt;

// The status-page-style segment bar (getUptimeSegments) shows up to 90 days,
// the widest window anything in this module reads; keep a small buffer
// beyond that so a segment right at the boundary still has the heartbeat
// just before window start to diff against, then prune anything older.
const HEARTBEAT_RETENTION_MS = 91 * DAY_MS;
// Rewriting the whole file on every single heartbeat would be more I/O than
// the file itself — pruning once every ~2 hours is more than often enough to
// keep it from growing unbounded over a long-lived process.
const PRUNE_EVERY_N_HEARTBEATS = 60;
let heartbeatCount = 0;

async function writeHeartbeat(): Promise<void> {
  try {
    await mkdir(UPTIME_DIR, { recursive: true });
    await appendFile(HEARTBEAT_FILE, `${JSON.stringify({ ts: Date.now() })}\n`, "utf8");

    heartbeatCount += 1;
    if (heartbeatCount % PRUNE_EVERY_N_HEARTBEATS === 0) {
      const cutoff = Date.now() - HEARTBEAT_RETENTION_MS;
      const kept = (await readHeartbeats()).filter((ts) => ts >= cutoff);
      await writeFile(HEARTBEAT_FILE, kept.map((ts) => `${JSON.stringify({ ts })}\n`).join(""), "utf8");
    }
  } catch (err) {
    console.warn("[uptime] failed to write heartbeat:", err);
  }
}

if (!globalForUptime.__prsyUptimeTimer) {
  void writeHeartbeat();
  const timer = setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);
  timer.unref?.();
  globalForUptime.__prsyUptimeTimer = timer;
}

async function readHeartbeats(): Promise<number[]> {
  try {
    const raw = await readFile(HEARTBEAT_FILE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return (JSON.parse(line) as { ts: number }).ts;
        } catch {
          return null;
        }
      })
      .filter((ts): ts is number => ts !== null)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

// Sums the gaps between consecutive heartbeats (and the tail gap to `now`)
// that exceed DOWNTIME_GAP_MS, treating that as time the process wasn't
// running to write one. Returns null when there isn't enough heartbeat
// history in the window yet, rather than a misleadingly confident number.
function computeUptimePercent(heartbeats: number[], windowStart: number, windowEnd: number): number | null {
  const inWindow = heartbeats.filter((ts) => ts >= windowStart && ts <= windowEnd);
  if (inWindow.length === 0) return null;

  let downtimeMs = 0;
  let prev = windowStart;
  for (const ts of inWindow) {
    const gap = ts - prev;
    if (gap > DOWNTIME_GAP_MS) downtimeMs += gap;
    prev = ts;
  }
  const tailGap = windowEnd - prev;
  if (tailGap > DOWNTIME_GAP_MS) downtimeMs += tailGap;

  const totalMs = windowEnd - windowStart;
  const uptimeMs = Math.max(0, totalMs - downtimeMs);
  return Math.min(100, Math.max(0, (uptimeMs / totalMs) * 100));
}

export type UptimeStats = {
  startedAt: number;
  currentUptimeMs: number;
};

export async function getUptimeStats(): Promise<UptimeStats> {
  return { startedAt: PROCESS_STARTED_AT, currentUptimeMs: Date.now() - PROCESS_STARTED_AT };
}

// A status-page-style (UptimeRobot/StatusPage) per-day segment strip,
// replacing the old plain "7d / 30d %" line — each segment is one calendar
// day's uptime, classified into a status band so the color reads at a
// glance without hovering.
export type DailyUptimeSegment = {
  dateKey: string; // ISO yyyy-mm-dd
  label: string; // Jalali "MM/DD"
  percent: number | null; // null = no heartbeat data for this day yet
  status: "up" | "partial" | "down" | "unknown";
};

export type UptimeSegmentsResult = {
  segments: DailyUptimeSegment[]; // oldest -> newest, today last
  summaryPercent: number | null; // uptime % across the whole shown window
};

const SEGMENT_WINDOW_DAYS = 90;

// >=99.5%: effectively fully up for the day (tolerates one flagged gap).
// <=50%: mostly down. Anything in between is a partial-outage day.
function classifySegmentStatus(percent: number | null): DailyUptimeSegment["status"] {
  if (percent === null) return "unknown";
  if (percent >= 99.5) return "up";
  if (percent <= 50) return "down";
  return "partial";
}

export async function getUptimeSegments(): Promise<UptimeSegmentsResult> {
  const heartbeats = await readHeartbeats();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const maxWindowStart = new Date(todayStart);
  maxWindowStart.setDate(maxWindowStart.getDate() - (SEGMENT_WINDOW_DAYS - 1));

  // Never show days before this app instance actually has data for —
  // a freshly-deployed server should show a short, honest strip, not 90
  // days of misleadingly-"unknown" gray boxes.
  const earliestKnownMs = heartbeats.length > 0 ? heartbeats[0] : PROCESS_STARTED_AT;
  const earliestDay = new Date(earliestKnownMs);
  earliestDay.setHours(0, 0, 0, 0);

  const windowStart = earliestDay.getTime() > maxWindowStart.getTime() ? earliestDay : maxWindowStart;

  const segments: DailyUptimeSegment[] = [];
  for (let dayStart = new Date(windowStart); dayStart <= todayStart; dayStart.setDate(dayStart.getDate() + 1)) {
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const windowEnd = Math.min(dayEnd.getTime(), now.getTime());
    // Clamp the first (deploy-day) segment's window start to when data
    // actually begins — otherwise the hours before the process/heartbeats
    // existed get counted as downtime, showing a false partial outage on
    // day one. A no-op for every later day, since earliestKnownMs always
    // falls on or before that day's own midnight.
    const segmentStart = Math.max(dayStart.getTime(), earliestKnownMs);
    const percent = computeUptimePercent(heartbeats, segmentStart, windowEnd);
    segments.push({ dateKey: isoDay(dayStart), label: toPersianDigits(jalaliDayLabel(dayStart)), percent, status: classifySegmentStatus(percent) });
  }

  const summaryPercent = computeUptimePercent(heartbeats, Math.max(windowStart.getTime(), earliestKnownMs), now.getTime());
  return { segments, summaryPercent };
}
