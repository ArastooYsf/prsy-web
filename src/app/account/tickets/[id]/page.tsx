import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS } from "@/lib/status-labels";
import TicketChat, { type ChatMessage } from "@/components/TicketChat";

export const dynamic = "force-dynamic";

export default async function AccountTicketDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, userId, deletedAt: null },
    include: {
      replies: { include: { author: true, attachments: true }, orderBy: { createdAt: "asc" } },
      user: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  const messages: ChatMessage[] = [
    {
      id: ticket.id,
      authorId: ticket.userId,
      authorLabel: "شما",
      isStaff: false,
      isReply: false,
      message: ticket.message,
      attachments: [],
      createdAt: ticket.createdAt.toISOString(),
      seenAt: ticket.messageSeenAt ? ticket.messageSeenAt.toISOString() : null,
      editedAt: null,
      deletedAt: null,
    },
    ...ticket.replies.map((reply) => ({
      id: reply.id,
      authorId: reply.authorId,
      authorLabel: reply.authorId === userId ? "شما" : "تیم پشتیبانی",
      isStaff: reply.authorId !== userId,
      isReply: true,
      message: reply.deletedAt ? "" : reply.message,
      attachments: reply.deletedAt
        ? []
        : reply.attachments.map((a) => ({ id: a.id, url: a.url, filename: a.filename, mimeType: a.mimeType, size: a.size })),
      createdAt: reply.createdAt.toISOString(),
      seenAt: reply.seenAt ? reply.seenAt.toISOString() : null,
      editedAt: reply.editedAt ? reply.editedAt.toISOString() : null,
      deletedAt: reply.deletedAt ? reply.deletedAt.toISOString() : null,
    })),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{ticket.subject}</h2>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
        >
          {TICKET_STATUS[ticket.status].label}
        </span>
      </div>

      <TicketChat
        ticketId={ticket.id}
        initialMessages={messages}
        viewerRole="customer"
        viewerId={userId}
        canReply={ticket.status !== "CLOSED"}
      />
    </div>
  );
}
