import type { TicketReply, TicketAttachment, User } from "@/generated/prisma/client";
import type { ChatMessage } from "@/components/TicketChat";

type ReplyWithRelations = TicketReply & {
  author: Pick<User, "id" | "role" | "name" | "email">;
  attachments: TicketAttachment[];
};

// Shared by the SSR initial load (account/tickets/[id] and
// account/admin/tickets/[id]) and the GET polling routes, so the mapping a
// viewer sees never drifts between first paint and a live-update tick.
// authorLabel differs by viewerRole: a customer only ever sees "تیم
// پشتیبانی" for anyone else (their ticket has no other customer on it),
// while staff can see another staff member's name or the customer's own.
export function mapTicketReplyToChatMessage(
  reply: ReplyWithRelations,
  viewerId: string,
  viewerRole: "customer" | "staff",
): ChatMessage {
  const isStaffAuthor = reply.author.role === "ADMIN" || reply.author.role === "SUPPORT";
  const authorLabel =
    reply.authorId === viewerId
      ? "شما"
      : viewerRole === "customer"
        ? "تیم پشتیبانی"
        : isStaffAuthor
          ? reply.author.name || "تیم پشتیبانی"
          : reply.author.name || reply.author.email;

  return {
    id: reply.id,
    authorId: reply.authorId,
    authorLabel,
    isStaff: isStaffAuthor,
    isReply: true,
    message: reply.deletedAt ? "" : reply.message,
    attachments: reply.deletedAt
      ? []
      : reply.attachments.map((a) => ({ id: a.id, url: a.url, filename: a.filename, mimeType: a.mimeType, size: a.size })),
    createdAt: reply.createdAt.toISOString(),
    seenAt: reply.seenAt ? reply.seenAt.toISOString() : null,
    editedAt: reply.editedAt ? reply.editedAt.toISOString() : null,
    deletedAt: reply.deletedAt ? reply.deletedAt.toISOString() : null,
  };
}
