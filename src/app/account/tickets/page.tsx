import Link from "next/link";
import { getServerSession } from "next-auth";
import { MessageSquare, Plus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketListItem } from "./TicketListItem";

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
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageSquare className="size-5 text-accent-400" />
          تیکت‌های پشتیبانی
        </h2>
        <Link
          href="/account/tickets/new"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          ثبت تیکت جدید
        </Link>
      </div>

      {tickets.length === 0 ? (
        <p className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز تیکتی ثبت نکرده‌اید.
        </p>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketListItem key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
