import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";
import { formatJalali } from "@/lib/jalali";
import { ORDER_STATUS } from "@/lib/status-labels";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { createNotification } from "./inapp";
import { ticketReplyEmail, staffNewMessageEmail, orderStatusEmail, contractExpiryEmail } from "./templates";

// Every notify* function below is safe to call without awaiting: internal
// errors are always caught and logged, never thrown, so a failed email/SMS
// can never break the request (ticket reply, order update, ...) that
// triggered it — see CLAUDE.md-adjacent request: "fire-and-forget, log on
// failure, never fail the main operation". Callers that DO need to know the
// work finished (e.g. the contract-expiry cron script, which exits right
// after) can still `await` the returned promise; it just never rejects.
const SITE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

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

  await trySendEmail(customer.email, title, ticketReplyEmail({ subject: ticket.subject, summary, link }), "پاسخ تیکت");

  if (customer.phone) {
    const shortSubject = ticket.subject.length > SMS_SUBJECT_MAX ? `${ticket.subject.slice(0, SMS_SUBJECT_MAX)}…` : ticket.subject;
    await trySendSms(customer.phone, `یاشار: به تیکت «${shortSubject}» پاسخ داده شد.\n${link}`, "پاسخ تیکت");
  }
}

/** A customer posted a new message on an (unassigned) ticket — notify every ADMIN/SUPPORT user by email + in-app, no SMS. */
export async function notifyStaffNewCustomerMessage({ ticket, customer }: { ticket: TicketRef; customer: UserRef }): Promise<void> {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPPORT"] }, deletedAt: null },
    select: { id: true, email: true },
  });
  if (staff.length === 0) return;

  const link = `${SITE_URL}/account/admin/tickets/${ticket.id}`;
  const customerName = customer.name || customer.email;
  const title = `پیام جدید در تیکت «${ticket.subject}»`;
  const message = `مشتری «${customerName}» پیام جدیدی ثبت کرد.`;

  await Promise.all(
    staff.map(async (member) => {
      await createNotification({ userId: member.id, title, message, link }).catch(() => {});
      await trySendEmail(member.email, title, staffNewMessageEmail({ subject: ticket.subject, customerName, link }), "پیام جدید مشتری");
    }),
  );
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
  await trySendEmail(customer.email, title, orderStatusEmail({ orderNumber: order.orderNumber, statusLabel, link }), "تغییر وضعیت سفارش");
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
  await trySendEmail(customer.email, title, contractExpiryEmail({ title: contract.title, endDateLabel, link }), "یادآوری انقضای قرارداد");
}
