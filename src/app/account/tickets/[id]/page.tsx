import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS } from "@/lib/status-labels";
import TicketThread from "@/components/TicketThread";
import TicketReplyForm from "@/components/account/TicketReplyForm";

export const dynamic = "force-dynamic";

export default async function AccountTicketDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, userId },
    include: { replies: { include: { author: true }, orderBy: { createdAt: "asc" } }, user: true },
  });

  if (!ticket) {
    notFound();
  }

  const messages = [
    {
      id: ticket.id,
      authorLabel: "شما",
      isStaff: false,
      message: ticket.message,
      createdAt: ticket.createdAt,
    },
    ...ticket.replies.map((reply) => ({
      id: reply.id,
      authorLabel: reply.authorId === userId ? "شما" : "تیم پشتیبانی",
      isStaff: reply.authorId !== userId,
      message: reply.message,
      createdAt: reply.createdAt,
    })),
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{ticket.subject}</h2>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
        >
          {TICKET_STATUS[ticket.status].label}
        </span>
      </div>

      <TicketThread messages={messages} />

      {ticket.status !== "CLOSED" && <TicketReplyForm ticketId={ticket.id} />}
    </div>
  );
}
