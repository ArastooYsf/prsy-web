export const TICKET_STATUS: Record<string, { label: string; className: string }> = {
  OPEN: { label: "باز", className: "border-accent-500/30 bg-accent-500/10 text-accent-400" },
  IN_PROGRESS: { label: "در حال بررسی", className: "border-brand-400/30 bg-brand-400/10 text-brand-300" },
  ANSWERED: { label: "پاسخ داده‌شده", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  CLOSED: { label: "بسته‌شده", className: "border-white/10 bg-white/5 text-foreground/60" },
};

export const CONTRACT_STATUS: Record<string, { label: string; className: string }> = {
  PENDING_APPROVAL: { label: "در انتظار تأیید", className: "border-accent-500/30 bg-accent-500/10 text-accent-400" },
  ACTIVE: { label: "فعال", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  RENEWING: { label: "در حال تمدید", className: "border-brand-400/30 bg-brand-400/10 text-brand-300" },
  EXPIRED: { label: "منقضی‌شده", className: "border-white/10 bg-white/5 text-foreground/60" },
  CANCELLED: { label: "لغوشده", className: "border-red-500/30 bg-red-500/10 text-red-400" },
};

export const CONTRACT_STATUSES = Object.keys(CONTRACT_STATUS);

export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "در انتظار تأیید", className: "border-accent-500/30 bg-accent-500/10 text-accent-400" },
  PROCESSING: { label: "در حال آماده‌سازی", className: "border-brand-400/30 bg-brand-400/10 text-brand-300" },
  SHIPPED: { label: "ارسال‌شده", className: "border-brand-400/30 bg-brand-400/10 text-brand-300" },
  DELIVERED: { label: "تحویل داده‌شده", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  CANCELLED: { label: "لغوشده", className: "border-red-500/30 bg-red-500/10 text-red-400" },
};

export const CUSTOMER_TYPE: Record<string, { label: string; className: string }> = {
  INDIVIDUAL: { label: "حقیقی", className: "border-white/10 bg-white/5 text-foreground/60" },
  LEGAL: { label: "حقوقی", className: "border-brand-400/30 bg-brand-400/10 text-brand-300" },
};

export const APPROVAL_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "در انتظار تأیید", className: "border-accent-500/30 bg-accent-500/10 text-accent-400" },
  APPROVED: { label: "تأییدشده", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  REJECTED: { label: "ردشده", className: "border-red-500/30 bg-red-500/10 text-red-400" },
};

export const ORDER_STEPS = [
  { status: "PENDING", label: "ثبت شد" },
  { status: "PROCESSING", label: "در حال آماده‌سازی" },
  { status: "SHIPPED", label: "ارسال شد" },
  { status: "DELIVERED", label: "تحویل داده شد" },
] as const;

export function orderStepIndex(status: string): number {
  return ORDER_STEPS.findIndex((s) => s.status === status);
}
