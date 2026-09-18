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

// Categories that are ALWAYS locked from the moment their file is created
// and can never be unlocked afterward — by an admin through the UI, through
// a direct API call, or through any future code path. This is the actual
// security boundary (enforced in logger.ts: setLogFileLocked refuses to
// remove the lock for these, and enforceRetention refuses to delete them
// regardless of what the mutable lock sidecar file says) — not a UI default
// that a confirm dialog can talk someone past.
export const PERMANENTLY_LOCKED_CATEGORIES: readonly LogCategory[] = ["crash", "access", "security"];

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
  | "notification_failed"
  | "national_id_inquiry_success"
  | "national_id_inquiry_failed"
  | "integration_run_success"
  | "integration_run_failed"
  | "integration_test_connection";

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
  national_id_inquiry_success: "استعلام شناسه ملی موفق بود",
  national_id_inquiry_failed: "استعلام شناسه ملی ناموفق بود",
  integration_run_success: "سرویس یکپارچه‌سازی را اجرا کرد",
  integration_run_failed: "اجرای سرویس یکپارچه‌سازی ناموفق بود",
  integration_test_connection: "اتصال یکپارچه‌سازی را تست کرد",
};
