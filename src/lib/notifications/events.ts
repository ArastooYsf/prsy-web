import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";
import { formatJalali } from "@/lib/jalali";
import { ORDER_STATUS } from "@/lib/status-labels";
import { SITE_URL } from "@/lib/site-url";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { createNotification } from "./inapp";
import {
  ticketReplyEmail,
  ticketStatusEmail,
  staffNewMessageEmail,
  consultationRequestEmail,
  orderStatusEmail,
  orderCreatedEmail,
  contractExpiryEmail,
  contractCreatedEmail,
  accountSecurityAlertEmail,
} from "./templates";

// Every notify* function below is safe to call without awaiting: internal
// errors are always caught and logged, never thrown, so a failed email/SMS
// can never break the request (ticket reply, order update, ...) that
// triggered it — see CLAUDE.md-adjacent request: "fire-and-forget, log on
// failure, never fail the main operation". Callers that DO need to know the
// work finished (e.g. the contract-expiry cron script, which exits right
// after) can still `await` the returned promise; it just never rejects.

const SYSTEM_ACTOR = { id: "system", name: "سیستم", email: "", role: "SYSTEM" };

const SMS_SUBJECT_MAX = 30;

async function logDelivery(channel: "email" | "sms", to: string, purpose: string, ok: boolean, error?: unknown): Promise<void> {
  await logEvent({
    category: "notification",
    actor: SYSTEM_ACTOR,
    action: ok ? "notification_sent" : "notification_failed",
    target: { type: channel, id: to, label: purpose },
    summary: ok ? undefined : error instanceof Error ? error.message : String(error),
  });
}

async function trySendEmail(to: string, subject: string, html: string, purpose: string): Promise<void> {
  try {
    await sendEmail({ to, subject, html });
    await logDelivery("email", to, purpose, true);
  } catch (err) {
    await logDelivery("email", to, purpose, false, err);
  }
}

async function trySendSms(to: string, message: string, purpose: string): Promise<void> {
  try {
    await sendSms({ to, message });
    await logDelivery("sms", to, purpose, true);
  } catch (err) {
    await logDelivery("sms", to, purpose, false, err);
  }
}

type TicketRef = { id: string; subject: string };
type UserRef = { id: string; email: string; phone?: string | null; name?: string | null };

// Per-user notification preferences (src/app/account/settings) — fetched
// fresh here rather than threaded through every call site's UserRef, since
// notify* calls aren't a hot path and callers (ticket reply route, order
// status route, contract-expiry cron) would otherwise all need to carry
// these six fields around just to pass them through. In-app is deliberately
// NOT gated by any of these — it always fires; only email/SMS are opt-out.
type NotifyPrefs = {
  notifyEmail: boolean;
  notifySms: boolean;
  notifyTicketReply: boolean;
  notifyOrderStatus: boolean;
  notifyContractExpiry: boolean;
  notifyStaffNewMessage: boolean;
};

async function getNotifyPrefs(userId: string): Promise<NotifyPrefs> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyEmail: true,
      notifySms: true,
      notifyTicketReply: true,
      notifyOrderStatus: true,
      notifyContractExpiry: true,
      notifyStaffNewMessage: true,
    },
  });
  // A deleted/missing user (race with account deletion) falls back to "on"
  // — the send will fail harmlessly against a stale email/phone anyway, and
  // silently dropping a notification because of a lookup miss is the wrong
  // failure mode here.
  return (
    user ?? {
      notifyEmail: true,
      notifySms: true,
      notifyTicketReply: true,
      notifyOrderStatus: true,
      notifyContractExpiry: true,
      notifyStaffNewMessage: true,
    }
  );
}

/** Staff replied to a customer's ticket — notify the customer by email + (if a phone is on file) SMS, plus an in-app bell entry. */
export async function notifyTicketReply({
  ticket,
  customer,
  replyMessage,
}: {
  ticket: TicketRef;
  customer: UserRef;
  replyMessage: string;
}): Promise<void> {
  const link = `${SITE_URL}/account/tickets/${ticket.id}`;
  const summary = replyMessage.length > 160 ? `${replyMessage.slice(0, 160)}…` : replyMessage;
  const title = `پاسخ جدید برای تیکت «${ticket.subject}»`;

  await createNotification({ userId: customer.id, title, message: summary, link }).catch(() => {});

  const prefs = await getNotifyPrefs(customer.id);

  if (prefs.notifyEmail && prefs.notifyTicketReply) {
    await trySendEmail(customer.email, title, ticketReplyEmail({ subject: ticket.subject, summary, link }), "پاسخ تیکت");
  }

  if (customer.phone && prefs.notifySms && prefs.notifyTicketReply) {
    const shortSubject = ticket.subject.length > SMS_SUBJECT_MAX ? `${ticket.subject.slice(0, SMS_SUBJECT_MAX)}…` : ticket.subject;
    await trySendSms(customer.phone, `یاشار: به تیکت «${shortSubject}» پاسخ داده شد.\n${link}`, "پاسخ تیکت");
  }
}

/** A ticket's status changed WITHOUT a reply message attached (the dedicated status route, separate from the reply route) — notify the customer by email + in-app, reusing the ticket-reply pref (closest topical match). */
export async function notifyTicketStatusChange({
  ticket,
  customer,
  statusLabel,
}: {
  ticket: TicketRef;
  customer: UserRef;
  statusLabel: string;
}): Promise<void> {
  const link = `${SITE_URL}/account/tickets/${ticket.id}`;
  const title = `وضعیت تیکت «${ticket.subject}» تغییر کرد`;
  const message = `وضعیت جدید: ${statusLabel}`;

  await createNotification({ userId: customer.id, title, message, link }).catch(() => {});
  const prefs = await getNotifyPrefs(customer.id);
  if (prefs.notifyEmail && prefs.notifyTicketReply) {
    await trySendEmail(customer.email, title, ticketStatusEmail({ subject: ticket.subject, statusLabel, link }), "تغییر وضعیت تیکت");
  }
}

/** A customer posted a new message on an (unassigned) ticket — notify every ADMIN/SUPPORT user by email + in-app, no SMS. */
export async function notifyStaffNewCustomerMessage({ ticket, customer }: { ticket: TicketRef; customer: UserRef }): Promise<void> {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPPORT"] }, deletedAt: null },
    select: { id: true, email: true, notifyEmail: true, notifyStaffNewMessage: true },
  });
  if (staff.length === 0) return;

  const link = `${SITE_URL}/account/admin/tickets/${ticket.id}`;
  const customerName = customer.name || customer.email;
  const title = `پیام جدید در تیکت «${ticket.subject}»`;
  const message = `مشتری «${customerName}» پیام جدیدی ثبت کرد.`;

  await Promise.all(
    staff.map(async (member) => {
      await createNotification({ userId: member.id, title, message, link }).catch(() => {});
      if (member.notifyEmail && member.notifyStaffNewMessage) {
        await trySendEmail(member.email, title, staffNewMessageEmail({ subject: ticket.subject, customerName, link }), "پیام جدید مشتری");
      }
    }),
  );
}

export type ConsultationRequest = { name: string; phone: string; email: string; topic: string; message: string };

/**
 * A visitor submitted the public consultation form — notify every ADMIN/SUPPORT
 * user in-app (always, full details, so the lead is stored even if email fails)
 * and by email (respecting their email opt-out). Returns how many staff were
 * notified so the caller can refuse to claim success when nobody could receive it.
 */
export async function notifyStaffConsultationRequest(request: ConsultationRequest): Promise<number> {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPPORT"] }, deletedAt: null },
    select: { id: true, email: true, notifyEmail: true },
  });

  const title = `درخواست مشاوره جدید: ${request.name}`;
  const message = [
    `نام: ${request.name}`,
    `تلفن: ${request.phone}`,
    request.email && `ایمیل: ${request.email}`,
    `موضوع: ${request.topic}`,
    request.message && `پیام: ${request.message}`,
  ]
    .filter(Boolean)
    .join("\n");

  const results = await Promise.all(
    staff.map(async (member) => {
      const stored = await createNotification({ userId: member.id, title, message }).then(() => true, () => false);
      if (member.notifyEmail) {
        await trySendEmail(member.email, title, consultationRequestEmail(request), "درخواست مشاوره");
      }
      return stored;
    }),
  );
  return results.filter(Boolean).length;
}

/** A new order was placed (self-checkout or created for a customer by staff) — notify by email + in-app (reuses the order-status pref, the closest topical match). */
export async function notifyOrderCreated({
  order,
  customer,
}: {
  order: { id: string; orderNumber: string };
  customer: UserRef;
}): Promise<void> {
  const link = `${SITE_URL}/account/orders/${order.id}`;
  const title = `سفارش «${order.orderNumber}» ثبت شد`;
  const message = "سفارش شما با موفقیت ثبت شد.";

  await createNotification({ userId: customer.id, title, message, link }).catch(() => {});
  const prefs = await getNotifyPrefs(customer.id);
  if (prefs.notifyEmail && prefs.notifyOrderStatus) {
    await trySendEmail(customer.email, title, orderCreatedEmail({ orderNumber: order.orderNumber, link }), "ثبت سفارش");
  }
}

/** An order's status changed — notify the customer by email + in-app (no SMS, per spec). */
export async function notifyOrderStatusChange({
  order,
  customer,
  newStatus,
}: {
  order: { id: string; orderNumber: string };
  customer: UserRef;
  newStatus: string;
}): Promise<void> {
  const link = `${SITE_URL}/account/orders/${order.id}`;
  const statusLabel = ORDER_STATUS[newStatus]?.label ?? newStatus;
  const title = `وضعیت سفارش «${order.orderNumber}» تغییر کرد`;
  const message = `وضعیت جدید: ${statusLabel}`;

  await createNotification({ userId: customer.id, title, message, link }).catch(() => {});
  const prefs = await getNotifyPrefs(customer.id);
  if (prefs.notifyEmail && prefs.notifyOrderStatus) {
    await trySendEmail(customer.email, title, orderStatusEmail({ orderNumber: order.orderNumber, statusLabel, link }), "تغییر وضعیت سفارش");
  }
}

export type AccountSecurityEventKind = "password_changed" | "two_factor_enabled" | "two_factor_disabled" | "email_changed";

const ACCOUNT_SECURITY_COPY: Record<AccountSecurityEventKind, { title: string; message: string }> = {
  password_changed: { title: "رمز عبور حساب شما تغییر کرد", message: "رمز عبور حساب کاربری شما همین الان تغییر کرد." },
  two_factor_enabled: {
    title: "احراز هویت دومرحله‌ای فعال شد",
    message: "احراز هویت دومرحله‌ای (۲FA) برای حساب شما فعال شد.",
  },
  two_factor_disabled: {
    title: "احراز هویت دومرحله‌ای غیرفعال شد",
    message: "احراز هویت دومرحله‌ای (۲FA) برای حساب شما غیرفعال شد.",
  },
  email_changed: { title: "ایمیل حساب شما تغییر کرد", message: "ایمیل حساب کاربری شما به آدرس جدیدی تغییر کرد." },
};

/**
 * A security-sensitive change to the account itself (password/2FA/email) —
 * in-app + email UNCONDITIONALLY, deliberately bypassing the notifyEmail
 * opt-out that every other notify* function respects: an attacker who
 * compromises an account could otherwise flip that toggle off first to
 * silence exactly this alert.
 */
export async function notifyAccountSecurityChange({
  user,
  kind,
}: {
  user: UserRef;
  kind: AccountSecurityEventKind;
}): Promise<void> {
  const { title, message } = ACCOUNT_SECURITY_COPY[kind];
  await createNotification({ userId: user.id, title, message }).catch(() => {});
  await trySendEmail(user.email, title, accountSecurityAlertEmail({ title, message }), title);
}

/** A legal customer's national-ID verification just succeeded — in-app only (informational, not a security alert, no dedicated pref field). Caller is responsible for only calling this on a real verified transition, not every re-check. */
export async function notifyNationalIdVerified(customer: { id: string }): Promise<void> {
  await createNotification({
    userId: customer.id,
    title: "استعلام شناسه ملی موفق بود",
    message: "شناسه ملی شرکت شما با موفقیت تأیید شد.",
  }).catch(() => {});
}

/** A customer's product comment was approved/rejected — in-app only (content-moderation status, not a security or transactional alert, no dedicated pref field). */
export async function notifyProductCommentModeration({
  author,
  productName,
  approved,
}: {
  author: { id: string };
  productName: string;
  approved: boolean;
}): Promise<void> {
  await createNotification({
    userId: author.id,
    title: approved ? "دیدگاه شما تأیید شد" : "دیدگاه شما رد شد",
    message: approved
      ? `دیدگاه شما روی «${productName}» تأیید و منتشر شد.`
      : `دیدگاه شما روی «${productName}» رد شد.`,
  }).catch(() => {});
}

/** A new contract was created for a customer — notify by email + in-app (reuses the contract-expiry pref, the closest topical match). */
export async function notifyContractCreated({
  contract,
  customer,
}: {
  contract: { id: string; title: string };
  customer: UserRef;
}): Promise<void> {
  const link = `${SITE_URL}/account/contracts`;
  const title = `قرارداد جدید «${contract.title}»`;
  const message = "یک قرارداد جدید برای شما ثبت شد.";

  await createNotification({ userId: customer.id, title, message, link }).catch(() => {});
  const prefs = await getNotifyPrefs(customer.id);
  if (prefs.notifyEmail && prefs.notifyContractExpiry) {
    await trySendEmail(customer.email, title, contractCreatedEmail({ title: contract.title, link }), "قرارداد جدید");
  }
}

/** A contract is within 7 days of its end date — notify the customer by email + in-app (no SMS, per spec). Caller is responsible for the once-only `expiryReminderSentAt` guard. */
export async function notifyContractExpiry({
  contract,
  customer,
}: {
  contract: { id: string; title: string; endDate: Date };
  customer: UserRef;
}): Promise<void> {
  const link = `${SITE_URL}/account/contracts`;
  const endDateLabel = formatJalali(contract.endDate);
  const title = `قرارداد «${contract.title}» رو به پایان است`;
  const message = `این قرارداد در تاریخ ${endDateLabel} به پایان می‌رسد.`;

  await createNotification({ userId: customer.id, title, message, link }).catch(() => {});
  const prefs = await getNotifyPrefs(customer.id);
  if (prefs.notifyEmail && prefs.notifyContractExpiry) {
    await trySendEmail(customer.email, title, contractExpiryEmail({ title: contract.title, endDateLabel, link }), "یادآوری انقضای قرارداد");
  }
}
