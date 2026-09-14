import type { ReactNode } from "react";
import {
  Circle,
  ArrowsClockwise,
  Clock,
  CheckCircle,
  Archive,
  XCircle,
  Truck,
  User,
  Buildings,
  Phone,
} from "@phosphor-icons/react/ssr";

export type StatusInfo = { label: string; className: string; icon: ReactNode };

export const TICKET_STATUS: Record<string, StatusInfo> = {
  OPEN: { label: "باز", className: "border-accent-500/30 bg-accent-500/10 text-accent-400", icon: <Circle size={11} weight="fill" /> },
  IN_PROGRESS: { label: "در حال بررسی", className: "border-brand-400/30 bg-brand-400/10 text-brand-300", icon: <ArrowsClockwise size={11} weight="bold" /> },
  WAITING_REPLY: { label: "در انتظار پاسخ", className: "border-red-500/30 bg-red-500/10 text-red-400", icon: <Clock size={11} weight="bold" /> },
  ANSWERED: { label: "پاسخ داده‌شده", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: <CheckCircle size={11} weight="fill" /> },
  CLOSED: { label: "بسته‌شده", className: "border-white/10 bg-white/5 text-foreground/60", icon: <Archive size={11} weight="bold" /> },
};

export const CONTRACT_STATUS: Record<string, StatusInfo> = {
  PENDING_APPROVAL: { label: "در انتظار تأیید", className: "border-accent-500/30 bg-accent-500/10 text-accent-400", icon: <Clock size={11} weight="bold" /> },
  ACTIVE: { label: "فعال", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: <CheckCircle size={11} weight="fill" /> },
  RENEWING: { label: "در حال تمدید", className: "border-brand-400/30 bg-brand-400/10 text-brand-300", icon: <ArrowsClockwise size={11} weight="bold" /> },
  EXPIRED: { label: "منقضی‌شده", className: "border-white/10 bg-white/5 text-foreground/60", icon: <Archive size={11} weight="bold" /> },
  CANCELLED: { label: "لغوشده", className: "border-red-500/30 bg-red-500/10 text-red-400", icon: <XCircle size={11} weight="fill" /> },
};

export const CONTRACT_STATUSES = Object.keys(CONTRACT_STATUS);

export const ORDER_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "در انتظار تأیید", className: "border-accent-500/30 bg-accent-500/10 text-accent-400", icon: <Clock size={11} weight="bold" /> },
  PROCESSING: { label: "در حال آماده‌سازی", className: "border-brand-400/30 bg-brand-400/10 text-brand-300", icon: <ArrowsClockwise size={11} weight="bold" /> },
  SHIPPED: { label: "ارسال‌شده", className: "border-brand-400/30 bg-brand-400/10 text-brand-300", icon: <Truck size={11} weight="bold" /> },
  DELIVERED: { label: "تحویل داده‌شده", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: <CheckCircle size={11} weight="fill" /> },
  CANCELLED: { label: "لغوشده", className: "border-red-500/30 bg-red-500/10 text-red-400", icon: <XCircle size={11} weight="fill" /> },
};

export const CUSTOMER_TYPE: Record<string, StatusInfo> = {
  INDIVIDUAL: { label: "حقیقی", className: "border-white/10 bg-white/5 text-foreground/60", icon: <User size={11} weight="bold" /> },
  LEGAL: { label: "حقوقی", className: "border-brand-400/30 bg-brand-400/10 text-brand-300", icon: <Buildings size={11} weight="bold" /> },
};

export const APPROVAL_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "در انتظار تأیید", className: "border-accent-500/30 bg-accent-500/10 text-accent-400", icon: <Clock size={11} weight="bold" /> },
  APPROVED: { label: "تأییدشده", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: <CheckCircle size={11} weight="fill" /> },
  REJECTED: { label: "ردشده", className: "border-red-500/30 bg-red-500/10 text-red-400", icon: <XCircle size={11} weight="fill" /> },
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

export const PRODUCT_AVAILABILITY: Record<string, StatusInfo> = {
  IN_STOCK: { label: "موجود", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: <CheckCircle size={11} weight="fill" /> },
  OUT_OF_STOCK: { label: "ناموجود", className: "border-red-500/30 bg-red-500/10 text-red-400", icon: <XCircle size={11} weight="fill" /> },
  CALL: { label: "تماس بگیرید", className: "border-accent-500/30 bg-accent-500/10 text-accent-400", icon: <Phone size={11} weight="bold" /> },
};

export const PRODUCT_AVAILABILITIES = Object.keys(PRODUCT_AVAILABILITY);
