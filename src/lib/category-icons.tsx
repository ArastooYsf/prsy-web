import type { ReactNode } from "react";

export const CATEGORY_ICON_KEYS = [
  "generator",
  "engine",
  "parts",
  "generator-engine",
  "alternator",
  "service",
  "box",
  "gear",
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

export const CATEGORY_ICON_LABELS: Record<CategoryIconKey, string> = {
  generator: "ژنراتور",
  engine: "موتور برق",
  parts: "قطعات",
  "generator-engine": "موتور ژنراتور",
  alternator: "دینام/آلترناتور",
  service: "خدمات و تعمیرات",
  box: "جعبه/عمومی",
  gear: "تنظیمات/عمومی",
};

export const CATEGORY_ICONS: Record<CategoryIconKey, ReactNode> = {
  generator: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M11.5 10.5l-3 3.6h2.1l-1 2.9 3.4-3.6h-2l0.5-2.9z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M19 10h2M19 14h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  engine: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7 11h10v3a5 5 0 01-5 5 5 5 0 01-5-5v-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 7v4M15 7v4M12 19v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  parts: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  "generator-engine": (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 9v3M13.5 9v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="6" y="12" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  alternator: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 5.5v3M12 15.5v3M5.5 12h3M15.5 12h3M7.5 7.5l2 2M14.5 14.5l2 2M7.5 16.5l2-2M14.5 9.5l2-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  service: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M14.7 6.3a4 4 0 00-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 005.4-5.4l-2.8 2.8-2-2 2.8-2.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  box: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.5 8.5L12 4l8.5 4.5V16L12 20.5 3.5 16V8.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3.5 8.5L12 13l8.5-4.5M12 13v7.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  gear: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
};
