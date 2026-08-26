// Pure data/types for the logging system — deliberately has NO Node-only
// imports (no fs, no os, no path) so client components (e.g.
// LogFileDetail.tsx) can import runtime values like ACTION_LABELS_FA
// without dragging src/lib/logger.ts's fs/promises-based implementation
// into the browser bundle. logger.ts re-exports everything here for
// existing server-side consumers, so this split is invisible to them.

export const DAILY_CATEGORIES = ["general", "important", "access", "notification"] as const;
export const EVENT_CATEGORIES = ["crash", "security"] as const;
export type LogCategory = (typeof DAILY_CATEGORIES)[number] | (typeof EVENT_CATEGORIES)[number];

export const ALL_LOG_CATEGORIES: readonly LogCategory[] = [...DAILY_CATEGORIES, ...EVENT_CATEGORIES];

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
  /** Optional request context — no current call site sets these yet, but the
   *  detail view already renders them when present (e.g. for a future
   *  auth.ts/security producer that has real IP data on hand). */
  ip?: string;
  userAgent?: string;
};

export const CATEGORY_LABELS_FA: Record<LogCategory, string> = {
  general: "عمومی",
  important: "مهم",
  access: "دسترسی",
  notification: "اعلان",
  security: "امنیتی",
  crash: "کرش",
};

export const ACTION_LABELS_FA: Record<LogAction, string> = {
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
