import { prisma } from "@/lib/prisma";

const DEDUP_WINDOW_MS = 1000;

// Server-side backstop against duplicate sends (e.g. a slow first request
// plus an impatient retry) — the client already disables the send control
// while a request is in flight, but this doesn't rely on that. If the same
// author posted the exact same message on this ticket within the last
// second, treat the new request as a repeat of that one instead of creating
// a second row.
export async function findRecentDuplicateReply(ticketId: string, authorId: string, message: string) {
  return prisma.ticketReply.findFirst({
    where: {
      ticketId,
      authorId,
      message,
      createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
    include: { attachments: true },
  });
}
