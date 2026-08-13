import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function AccountTicketsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const tickets = await prisma.ticket.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">تیکت‌های پشتیبانی</h2>
        <Link
          href="/account/tickets/new"
          className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          ثبت تیکت جدید
        </Link>
      </div>

      {tickets.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز تیکتی ثبت نکرده‌اید.
        </p>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/account/tickets/${ticket.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-accent-500/30"
            >
              <div>
                <p className="font-semibold">{ticket.subject}</p>
                <p dir="ltr" className="mt-1 text-right text-xs text-foreground/50">
                  {ticket.updatedAt.toLocaleDateString("fa-IR")}
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
              >
                {TICKET_STATUS[ticket.status].label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
