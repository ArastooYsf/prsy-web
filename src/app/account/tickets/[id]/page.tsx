import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS } from "@/lib/status-labels";
import TicketChat, { type ChatMessage } from "@/components/TicketChat";
import StatusBadge from "@/components/ui/StatusBadge";
import { debugSlowLoad } from "@/lib/debug-slow-load";
import { mapTicketReplyToChatMessage } from "@/lib/ticket-chat-messages";

export const dynamic = "force-dynamic";

export default async function AccountTicketDetailPage({ params }: { params: { id: string } }) {
  await debugSlowLoad();

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
    ...ticket.replies.map((reply) => mapTicketReplyToChatMessage(reply, userId, "customer")),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{ticket.subject}</h2>
        <StatusBadge status={TICKET_STATUS[ticket.status]} />
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
