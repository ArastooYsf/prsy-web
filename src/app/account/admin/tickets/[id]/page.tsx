import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketChat, { type ChatMessage } from "@/components/TicketChat";
import TicketStatusSelect from "@/components/admin/TicketStatusSelect";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";

export const dynamic = "force-dynamic";

export default async function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const viewerId = session!.user.id;

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, deletedAt: null },
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
      authorLabel: ticket.user.name || ticket.user.email,
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
      authorLabel:
        reply.authorId === viewerId
          ? "شما"
          : reply.author.role === "ADMIN" || reply.author.role === "SUPPORT"
            ? reply.author.name || "تیم پشتیبانی"
            : reply.author.name || reply.author.email,
      isStaff: reply.author.role === "ADMIN" || reply.author.role === "SUPPORT",
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
        <div>
          <h2 className="text-lg font-bold">{ticket.subject}</h2>
          <p className="mt-1 text-xs text-foreground/50">{ticket.user.name || ticket.user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
          <DeleteEntityButton
            endpoint={`/api/admin/tickets/${ticket.id}`}
            title="حذف تیکت"
            message={`مطمئنید می‌خواهید تیکت «${ticket.subject}» را حذف کنید؟`}
            redirectTo="/account/admin/tickets"
          />
        </div>
      </div>

      <TicketChat ticketId={ticket.id} initialMessages={messages} viewerRole="staff" viewerId={viewerId} canReply />
    </div>
  );
}
