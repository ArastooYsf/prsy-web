import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketChat, { type ChatMessage } from "@/components/TicketChat";
import TicketStatusSelect from "@/components/admin/TicketStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const viewerId = session!.user.id;

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { replies: { include: { author: true }, orderBy: { createdAt: "asc" } }, user: true },
  });

  if (!ticket) {
    notFound();
  }

  const messages: ChatMessage[] = [
    {
      id: ticket.id,
      authorId: ticket.userId,
      authorLabel: ticket.user.name || ticket.user.email,
      isStaff: false,
      message: ticket.message,
      attachmentUrl: null,
      attachmentName: null,
      createdAt: ticket.createdAt.toISOString(),
      seenAt: ticket.messageSeenAt ? ticket.messageSeenAt.toISOString() : null,
    },
    ...ticket.replies.map((reply) => ({
      id: reply.id,
      authorId: reply.authorId,
      authorLabel:
        reply.authorId === viewerId
          ? "شما"
          : reply.author.role === "ADMIN" || reply.author.role === "SUPPORT"
            ? reply.author.name || "تیم پشتیبانی"
            : reply.author.name || reply.author.email,
      isStaff: reply.author.role === "ADMIN" || reply.author.role === "SUPPORT",
      message: reply.message,
      attachmentUrl: reply.attachmentUrl,
      attachmentName: reply.attachmentName,
      createdAt: reply.createdAt.toISOString(),
      seenAt: reply.seenAt ? reply.seenAt.toISOString() : null,
    })),
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{ticket.subject}</h2>
          <p className="mt-1 text-xs text-foreground/50">{ticket.user.name || ticket.user.email}</p>
        </div>
        <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
      </div>

      <TicketChat ticketId={ticket.id} initialMessages={messages} viewerRole="staff" canReply />
    </div>
  );
}
