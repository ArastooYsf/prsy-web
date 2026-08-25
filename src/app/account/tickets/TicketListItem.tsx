import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { TICKET_STATUS } from "@/lib/status-labels";
import type { Prisma } from "@/generated/prisma/client";

export type Ticket = Prisma.TicketGetPayload<object>;

// Used both by page.tsx (real ticket) and loading.tsx (ticket=null) so the
// placeholder row is always exactly this row's real shape.
export function TicketListItem({ ticket }: { ticket: Ticket | null }) {
  const content = (
    <>
      <div>
        {ticket ? <p className="font-semibold">{ticket.subject}</p> : <Skeleton width={220} height={16} />}
        <p dir="ltr" className="mt-1 text-right text-xs text-foreground/50">
          {ticket ? ticket.updatedAt.toLocaleDateString("fa-IR") : <Skeleton width={110} height={11} />}
        </p>
      </div>
      {ticket ? (
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
        >
          {TICKET_STATUS[ticket.status].label}
        </span>
      ) : (
        <Skeleton width={72} height={22} borderRadius={9999} />
      )}
    </>
  );

  if (!ticket) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/account/tickets/${ticket.id}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 transition-colors hover:border-accent-500/30"
    >
      {content}
    </Link>
  );
}
