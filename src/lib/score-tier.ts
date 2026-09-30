// Single source of truth for the Lighthouse performance score tiers (good
// >=90 / warning >=50 / critical below), shared by the stat card (Tailwind
// text color) and the trend chart (raw hex for an SVG dot fill) so the two
// can't drift into disagreeing about whether the same score is "good".
export type ScoreTier = "good" | "warning" | "critical";

export function scoreTier(score: number): ScoreTier {
  if (score >= 90) return "good";
  if (score >= 50) return "warning";
  return "critical";
}

const TIER_HEX: Record<ScoreTier, string> = {
  good: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
};

const TIER_TEXT_CLASS: Record<ScoreTier, string> = {
  good: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400",
};

export function scoreTierHex(score: number): string {
  return TIER_HEX[scoreTier(score)];
}

export function scoreTierTextClass(score: number): string {
  return TIER_TEXT_CLASS[scoreTier(score)];
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Continuous red->amber->emerald interpolation (in RGB, two linear segments)
// for anything rendering the score as a filled bar/number — a discrete
// 3-color step would visibly "jump" as a live progress bar fills. Stops are
// derived from TIER_HEX (not re-typed) and anchored at scoreTier's own
// thresholds (50, 90) — using round numbers here instead would mean a score
// classified "good" by scoreTier still renders a slightly-off-emerald color,
// disagreeing with scoreTierHex for the same score.
const GRADIENT_STOPS: [number, [number, number, number]][] = [
  [0, hexToRgb(TIER_HEX.critical)],
  [50, hexToRgb(TIER_HEX.warning)],
  [90, hexToRgb(TIER_HEX.good)],
];

export function scoreGradientColor(score: number): string {
  const clamped = Math.min(100, Math.max(0, score));
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const [loStop, loRgb] = GRADIENT_STOPS[i];
    const [hiStop, hiRgb] = GRADIENT_STOPS[i + 1];
    if (clamped >= loStop && clamped <= hiStop) {
      const t = (clamped - loStop) / (hiStop - loStop);
      const [r, g, b] = loRgb.map((c, idx) => Math.round(c + (hiRgb[idx] - c) * t));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  // Above the last stop (>=90): pure "good" color, same as scoreTierHex.
  const [r, g, b] = GRADIENT_STOPS[GRADIENT_STOPS.length - 1][1];
  return `rgb(${r}, ${g}, ${b})`;
}

// Core Web Vitals good/needs-improvement/poor control points, straight from
// web.dev/vitals and web.dev's Lighthouse scoring docs — deliberately a
// separate table from the 0-100 score tiers above, since e.g. an LCP of 2.5s
// is "good" but has nothing to do with the 50/90 score cutoffs.
export type VitalKey = "lcp" | "cls" | "tbt" | "fcp";

const VITAL_THRESHOLDS: Record<VitalKey, { good: number; poor: number }> = {
  lcp: { good: 2.5, poor: 4 }, // seconds
  cls: { good: 0.1, poor: 0.25 }, // unitless
  tbt: { good: 200, poor: 600 }, // milliseconds
  fcp: { good: 1.8, poor: 3 }, // seconds
};

export function vitalTier(key: VitalKey, value: number): ScoreTier {
  const { good, poor } = VITAL_THRESHOLDS[key];
  if (value <= good) return "good";
  if (value <= poor) return "warning";
  return "critical";
}

export function vitalTierTextClass(key: VitalKey, value: number): string {
  return TIER_TEXT_CLASS[vitalTier(key, value)];
}
