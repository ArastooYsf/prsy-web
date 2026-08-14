import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, logEvent } from "@/lib/logger";
import { APPROVAL_STATUS } from "@/lib/status-labels";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const customer = await prisma.user.findUnique({ where: { id: params.id } });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "مشتری یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action === "APPROVE" ? "APPROVED" : body?.action === "REJECT" ? "REJECTED" : null;

  if (!action) {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: customer.id },
    data: { approvalStatus: action },
  });

  await logEvent({
    actor: actorFromSession(session),
    action: "approval_change",
    target: { type: "customer", id: updated.id, label: `مشتری «${updated.name || updated.email}»` },
    summary: `به «${APPROVAL_STATUS[action]?.label ?? action}»`,
  });

  return NextResponse.json({ customer: { id: updated.id, approvalStatus: updated.approvalStatus } });
}
