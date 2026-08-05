import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketThread from "@/components/TicketThread";
import TicketReplyForm from "@/components/admin/TicketReplyForm";
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

  const messages = [
    {
      id: ticket.id,
      authorLabel: ticket.user.name || ticket.user.email,
      isStaff: false,
      message: ticket.message,
      createdAt: ticket.createdAt,
    },
    ...ticket.replies.map((reply) => ({
      id: reply.id,
      authorLabel: reply.authorId === viewerId ? "شما" : reply.author.name || "تیم پشتیبانی",
      isStaff: reply.author.role === "ADMIN" || reply.author.role === "SUPPORT",
      message: reply.message,
      createdAt: reply.createdAt,
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

      <TicketThread messages={messages} />

      <TicketReplyForm ticketId={ticket.id} />
    </div>
  );
}
