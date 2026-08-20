import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, logEvent } from "@/lib/logger";
import { TICKET_STATUS } from "@/lib/status-labels";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_REPLY", "ANSWERED", "CLOSED"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "وضعیت نامعتبر است." }, { status: 400 });
  }

  const ticket = await prisma.ticket.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: status as typeof ticket.status } });

  await logEvent({
    actor: actorFromSession(session),
    action: "status_change",
    target: { type: "ticket", id: ticket.id, label: `تیکت «${ticket.subject}»` },
    summary: `از «${TICKET_STATUS[ticket.status]?.label ?? ticket.status}» به «${TICKET_STATUS[status]?.label ?? status}»`,
  });

  return NextResponse.json({ ok: true });
}
