import { access, mkdir, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { execFileAsync } from "@/lib/exec-file";
import { STRATEGY_LABELS_FA, type LighthouseStrategy } from "@/lib/lighthouse-strategy";

// Same "outside the app's own directory" reasoning as LOG_DIR/UPTIME_DIR —
// score history must survive a redeploy.
const LIGHTHOUSE_DIR = path.join(os.homedir(), ".prsy-website", "lighthouse");
const HISTORY_FILE = path.join(LIGHTHOUSE_DIR, "history.json");
const MAX_HISTORY_ENTRIES = 120; // 60 per strategy at the old cap, now that runs are split mobile/desktop
const MIN_RUN_INTERVAL_MS = 60 * 1000;
const RUN_TIMEOUT_MS = 120 * 1000;

// Matches the exact working invocation already documented in this project's
// CLAUDE.md QA checklist (headless Chromium via CDP, no sandbox). Most
// shared hosting plans don't allow installing/launching a Chromium binary at
// all, so this path is only used when one is actually present (see
// isLocalChromiumAvailable below) — everywhere else falls back to the
// PageSpeed Insights API, which needs no browser on this server at all.
const CHROME_PATH = process.env.CHROME_PATH ?? "/snap/bin/chromium";

// PageSpeed Insights runs Lighthouse on Google's own infrastructure against
// a URL it fetches itself, so this must be a URL reachable from the public
// internet — "http://localhost:3000" (the local dev default) will simply
// fail there. Set LIGHTHOUSE_TARGET_URL to the real public domain once the
// site is online for the API path to work; the local-Chromium path has no
// such restriction since it audits from inside this same machine.
const TARGET_URL = process.env.LIGHTHOUSE_TARGET_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

// Free key from Google Cloud Console: console.cloud.google.com -> create/select
// a project -> "APIs & Services" -> Library -> enable "PageSpeed Insights API"
// -> Credentials -> "Create credentials" -> API key. No billing account is
// required for this API's free quota.
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;
const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export type { LighthouseStrategy };
export const LIGHTHOUSE_STRATEGIES: LighthouseStrategy[] = ["mobile", "desktop"];

export type CategoryScores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
};

export type CoreWebVitals = {
  lcp: number | null; // seconds
  cls: number | null; // unitless
  tbt: number | null; // milliseconds
  fcp: number | null; // seconds
};

export type LighthouseOpportunity = {
  id: string;
  title: string;
  description: string;
  savingsMs: number | null;
};

export type LighthouseRun = {
  timestamp: string;
  // Optional only for backward-compat with history entries written before
  // this field existed — those were always a local desktop run, so they're
  // normalized to "desktop" on read (see getLighthouseHistory).
  strategy: LighthouseStrategy;
  performanceScore: number;
  // Undefined only for pre-existing history entries from before the detailed
  // breakdown was added — the UI simply renders those without the extra
  // sections rather than backfilling fake data.
  scores?: CategoryScores;
  vitals?: CoreWebVitals;
  opportunities?: LighthouseOpportunity[];
};

export async function getLighthouseHistory(): Promise<LighthouseRun[]> {
  try {
    const raw = await readFile(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw) as LighthouseRun[];
    return parsed.map((run) => ({ ...run, strategy: run.strategy ?? "desktop" }));
  } catch {
    return [];
  }
}

// Shape shared by both the local Lighthouse CLI's JSON output and the
// PageSpeed Insights API's `lighthouseResult` field — same report format
// either way, so one parser serves both sources.
type RawLighthouseReport = {
  categories?: {
    performance?: { score?: number };
    accessibility?: { score?: number };
    "best-practices"?: { score?: number };
    seo?: { score?: number };
  };
  audits?: Record<
    string,
    {
      title?: string;
      description?: string;
      numericValue?: number;
      details?: { type?: string; overallSavingsMs?: number };
    }
  >;
};

type PageSpeedReport = {
  lighthouseResult?: RawLighthouseReport;
  error?: { message?: string };
};

async function isLocalChromiumAvailable(): Promise<boolean> {
  try {
    await access(CHROME_PATH);
    return true;
  } catch {
    return false;
  }
}

// Best-effort Persian labels for the most common "opportunity" audits;
// anything else falls back to Lighthouse's own English title, per the
// request's own allowance for partial coverage.
const OPPORTUNITY_LABELS_FA: Record<string, string> = {
  "render-blocking-resources": "حذف منابع مسدودکننده‌ی رندر",
  "unused-css-rules": "حذف CSS استفاده‌نشده",
  "unused-javascript": "حذف جاوااسکریپت استفاده‌نشده",
  "unminified-css": "فشرده‌سازی (minify) فایل‌های CSS",
  "unminified-javascript": "فشرده‌سازی (minify) فایل‌های جاوااسکریپت",
  "modern-image-formats": "استفاده از فرمت‌های تصویر مدرن (WebP/AVIF)",
  "offscreen-images": "تأخیر در بارگذاری تصاویر خارج از دید (lazy load)",
  "efficient-animated-content": "بهینه‌سازی محتوای انیمیشنی",
  "uses-responsive-images": "استفاده از تصاویر ریسپانسیو با سایز مناسب",
  "uses-text-compression": "فعال‌سازی فشرده‌سازی متن (gzip/brotli)",
  "server-response-time": "کاهش زمان پاسخ سرور (TTFB)",
  "uses-rel-preconnect": "استفاده از preconnect برای منابع مهم",
  "font-display": "تنظیم font-display: swap برای فونت‌ها",
  "third-party-summary": "کاهش تأثیر اسکریپت‌های شخص ثالث",
  "largest-contentful-paint-element": "بهینه‌سازی عنصر اصلی LCP",
  "dom-size": "کاهش تعداد عناصر DOM",
  "duplicated-javascript": "حذف جاوااسکریپت تکراری",
  "legacy-javascript": "حذف پالی‌فیل/کد قدیمی غیرضروری",
};

const MAX_OPPORTUNITIES = 8;

function extractScores(report: RawLighthouseReport): CategoryScores | null {
  const performance = report.categories?.performance?.score;
  if (typeof performance !== "number") return null;

  const toScore = (v: number | undefined) => (typeof v === "number" ? Math.round(v * 100) : 0);
  return {
    performance: toScore(performance),
    accessibility: toScore(report.categories?.accessibility?.score),
    bestPractices: toScore(report.categories?.["best-practices"]?.score),
    seo: toScore(report.categories?.seo?.score),
  };
}

function extractVitals(report: RawLighthouseReport): CoreWebVitals {
  const audits = report.audits ?? {};
  const numeric = (id: string) => audits[id]?.numericValue;
  const lcpMs = numeric("largest-contentful-paint");
  const fcpMs = numeric("first-contentful-paint");
  const cls = numeric("cumulative-layout-shift");
  const tbt = numeric("total-blocking-time");

  return {
    lcp: typeof lcpMs === "number" ? lcpMs / 1000 : null,
    cls: typeof cls === "number" ? cls : null,
    tbt: typeof tbt === "number" ? tbt : null,
    fcp: typeof fcpMs === "number" ? fcpMs / 1000 : null,
  };
}

function extractOpportunities(report: RawLighthouseReport): LighthouseOpportunity[] {
  const audits = report.audits ?? {};
  return Object.entries(audits)
    .filter(([, audit]) => audit.details?.type === "opportunity" && (audit.details?.overallSavingsMs ?? 0) > 0)
    .map(([id, audit]) => ({
      id,
      title: OPPORTUNITY_LABELS_FA[id] ?? audit.title ?? id,
      // Lighthouse audit descriptions are markdown with a trailing
      // "[Learn more](url)" link — stripped for a clean plain-text line.
      description: (audit.description ?? "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim(),
      savingsMs: audit.details?.overallSavingsMs ?? null,
    }))
    .sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0))
    .slice(0, MAX_OPPORTUNITIES);
}

function reportToRun(report: RawLighthouseReport, strategy: LighthouseStrategy): { run: LighthouseRun } | { error: string } {
  const scores = extractScores(report);
  if (!scores) {
    return { error: "خروجی تست سرعت قابل تفسیر نبود." };
  }

  return {
    run: {
      timestamp: new Date().toISOString(),
      strategy,
      performanceScore: scores.performance,
      scores,
      vitals: extractVitals(report),
      opportunities: extractOpportunities(report),
    },
  };
}

/** Runs the real Lighthouse CLI against a local/full-access Chromium. */
async function runLocalLighthouse(strategy: LighthouseStrategy): Promise<{ run: LighthouseRun } | { error: string }> {
  await mkdir(LIGHTHOUSE_DIR, { recursive: true });
  const outFile = path.join(LIGHTHOUSE_DIR, `run-${strategy}-${Date.now()}.json`);
  // Lighthouse's default (no --preset) already emulates a mid-tier mobile
  // device; --preset=desktop switches the same run to a desktop viewport/CPU
  // profile — the same two presets `runLighthouseAudit` used to hardcode to
  // desktop-only.
  const presetArgs = strategy === "desktop" ? ["--preset=desktop"] : [];

  try {
    await execFileAsync(
      "npx",
      [
        "--yes",
        "lighthouse",
        TARGET_URL,
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
        "--only-categories=performance,accessibility,best-practices,seo",
        ...presetArgs,
        "--output=json",
        `--output-path=${outFile}`,
      ],
      { env: { ...process.env, CHROME_PATH }, timeout: RUN_TIMEOUT_MS, maxBuffer: 50 * 1024 * 1024 },
    );

    const raw = await readFile(outFile, "utf8");
    const report = JSON.parse(raw) as RawLighthouseReport;
    return reportToRun(report, strategy);
  } catch (err) {
    console.warn("[lighthouse] local audit failed:", err);
    return { error: "اجرای تست سرعت محلی ناموفق بود — ممکن است ابزار Lighthouse یا مرورگر Chromium در این محیط در دسترس نباشد." };
  } finally {
    await rm(outFile, { force: true });
  }
}

/** Runs the same performance audit via Google's hosted PageSpeed Insights API — no local browser needed. */
async function runPageSpeedApi(strategy: LighthouseStrategy): Promise<{ run: LighthouseRun } | { error: string }> {
  if (!PAGESPEED_API_KEY) {
    return {
      error:
        "کلید API سرویس PageSpeed Insights تنظیم نشده است — متغیر محیطی PAGESPEED_API_KEY را با یک کلید رایگان از Google Cloud Console تنظیم کنید.",
    };
  }

  const url = new URL(PAGESPEED_API_URL);
  url.searchParams.set("url", TARGET_URL);
  url.searchParams.set("key", PAGESPEED_API_KEY);
  url.searchParams.set("strategy", strategy);
  for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
    url.searchParams.append("category", category);
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(RUN_TIMEOUT_MS) });
    const body = (await res.json().catch(() => null)) as PageSpeedReport | null;

    if (!res.ok || !body) {
      console.warn("[lighthouse] PageSpeed API request failed:", res.status, body?.error?.message);
      return { error: "درخواست به سرویس PageSpeed Insights ناموفق بود — بعداً دوباره امتحان کنید." };
    }

    if (!body.lighthouseResult) {
      return { error: "خروجی PageSpeed Insights قابل تفسیر نبود — آدرس سایت باید از اینترنت عمومی در دسترس باشد." };
    }

    return reportToRun(body.lighthouseResult, strategy);
  } catch (err) {
    console.warn("[lighthouse] PageSpeed API call failed:", err);
    return { error: "اتصال به سرویس PageSpeed Insights برقرار نشد." };
  }
}

/**
 * Runs a real performance/accessibility/best-practices/SEO audit for one
 * strategy (mobile or desktop) against this app and appends it to a
 * persisted history file. Prefers a local Chromium install and falls back to
 * the PageSpeed Insights API when none is available — the common case on
 * shared hosting, where installing a headless browser usually isn't
 * possible. Never throws: the caller always gets either a run or a
 * user-facing Persian error.
 */
let auditInProgress = false;

export async function runLighthouseAudit(strategy: LighthouseStrategy): Promise<{ run: LighthouseRun } | { error: string }> {
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

  try {
    const history = await getLighthouseHistory();
    // Rate-limited per strategy, not globally — otherwise running "هر دو"
    // (mobile then desktop back-to-back) would always fail its second leg.
    const last = [...history].reverse().find((r) => r.strategy === strategy);
    if (last && Date.now() - new Date(last.timestamp).getTime() < MIN_RUN_INTERVAL_MS) {
      return { error: `لطفاً کمی صبر کنید — هر یک دقیقه فقط یک‌بار می‌توان تست سرعت (${STRATEGY_LABELS_FA[strategy]}) را اجرا کرد.` };
    }

    const result = (await isLocalChromiumAvailable()) ? await runLocalLighthouse(strategy) : await runPageSpeedApi(strategy);
    if ("error" in result) {
      return result;
    }

    await mkdir(LIGHTHOUSE_DIR, { recursive: true });
    const nextHistory = [...history, result.run].slice(-MAX_HISTORY_ENTRIES);
    await writeFile(HISTORY_FILE, JSON.stringify(nextHistory, null, 2), "utf8");
    return result;
  } finally {
    auditInProgress = false;
  }
}
