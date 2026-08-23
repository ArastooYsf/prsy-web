import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { TICKET_STATUS } from "@/lib/status-labels";
import { formatJalali } from "@/lib/jalali";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";
import type { Prisma } from "@/generated/prisma/client";

export type TicketWithUser = Prisma.TicketGetPayload<{ include: { user: true } }>;

// Used both by page.tsx (with a real ticket) and by loading.tsx (with
// ticket=null, for a placeholder row) — each field falls back to a Skeleton
// on its own, so the loading row is always exactly this row's real shape.
export function TicketCardMobile({ ticket }: { ticket: TicketWithUser | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        {ticket ? (
          <Link
            href={`/account/admin/tickets/${ticket.id}`}
            className="inline-flex min-h-11 items-center py-1 font-medium hover:text-accent-400"
          >
            {ticket.subject}
          </Link>
        ) : (
          <Skeleton width="55%" height={15} />
        )}
        {ticket ? (
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
          >
            {TICKET_STATUS[ticket.status].label}
          </span>
        ) : (
          <Skeleton width={62} height={23} borderRadius={9999} containerClassName="shrink-0" />
        )}
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">مشتری</dt>
          <dd className="text-foreground/70">{ticket ? ticket.user.name || ticket.user.email : <Skeleton width={88} height={11} />}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">آخرین بروزرسانی</dt>
          <dd dir="ltr" className="text-foreground/70">
            {ticket ? formatJalali(ticket.updatedAt) : <Skeleton width={68} height={11} />}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex justify-end border-t border-white/5 pt-3">
        {ticket ? (
          <DeleteEntityButton
            endpoint={`/api/admin/tickets/${ticket.id}`}
            title="حذف تیکت"
            message={`مطمئنید می‌خواهید تیکت «${ticket.subject}» را حذف کنید؟`}
          />
        ) : (
          <Skeleton width={68} height={40} borderRadius={9999} />
        )}
      </div>
    </div>
  );
}

export function TicketRowDesktop({ ticket }: { ticket: TicketWithUser | null }) {
  return (
    <tr className="border-t border-white/10">
      <td className="px-4 py-3 font-medium">
        {ticket ? (
          <Link href={`/account/admin/tickets/${ticket.id}`} className="hover:text-accent-400">
            {ticket.subject}
          </Link>
        ) : (
          <Skeleton width="70%" height={13} />
        )}
      </td>
      <td className="px-4 py-3 text-foreground/70">{ticket ? ticket.user.name || ticket.user.email : <Skeleton width={100} height={13} />}</td>
      <td className="px-4 py-3">
        {ticket ? (
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
          >
            {TICKET_STATUS[ticket.status].label}
          </span>
        ) : (
          <Skeleton width={62} height={22} borderRadius={9999} />
        )}
      </td>
      <td dir="ltr" className="px-4 py-3 text-right text-foreground/60">
        {ticket ? formatJalali(ticket.updatedAt) : <Skeleton width={78} height={13} />}
      </td>
      <td className="px-4 py-3">
        {ticket ? (
          <DeleteEntityButton
            endpoint={`/api/admin/tickets/${ticket.id}`}
            title="حذف تیکت"
            message={`مطمئنید می‌خواهید تیکت «${ticket.subject}» را حذف کنید؟`}
          />
        ) : (
          <Skeleton width={68} height={40} borderRadius={9999} />
        )}
      </td>
    </tr>
  );
}
