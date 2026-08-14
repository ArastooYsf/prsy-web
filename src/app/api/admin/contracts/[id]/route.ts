import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTRACT_STATUS, CONTRACT_STATUSES } from "@/lib/status-labels";
import { actorFromSession, logEvent } from "@/lib/logger";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.contract.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "قرارداد یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const type = typeof body?.type === "string" ? body.type.trim() : "";
  const startDate = typeof body?.startDate === "string" ? new Date(body.startDate) : null;
  const endDate = typeof body?.endDate === "string" ? new Date(body.endDate) : null;
  const status = CONTRACT_STATUSES.includes(body?.status) ? body.status : "ACTIVE";
  const fileUrl = typeof body?.fileUrl === "string" ? body.fileUrl : null;

  if (!userId || !title || !type || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "همه فیلدهای الزامی را پر کنید." }, { status: 400 });
  }

  const customer = await prisma.user.findUnique({ where: { id: userId } });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "مشتری معتبر نیست." }, { status: 400 });
  }

  await prisma.contractType.upsert({ where: { label: type }, update: {}, create: { label: type } });

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: { userId, title, type, startDate, endDate, status, fileUrl },
  });

  await logEvent({
    actor: actorFromSession(session),
    action: existing.status !== status ? "status_change" : "update",
    target: { type: "contract", id: contract.id, label: `قرارداد «${contract.title}»` },
    summary:
      existing.status !== status
        ? `از «${CONTRACT_STATUS[existing.status]?.label ?? existing.status}» به «${CONTRACT_STATUS[status]?.label ?? status}»`
        : undefined,
  });

  return NextResponse.json({ contract });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const contract = await prisma.contract.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!contract) {
    return NextResponse.json({ error: "قرارداد یافت نشد." }, { status: 404 });
  }

  await prisma.contract.update({ where: { id: contract.id }, data: { deletedAt: new Date() } });

  await logEvent({
    actor: actorFromSession(session),
    action: "delete",
    target: { type: "contract", id: contract.id, label: `قرارداد «${contract.title}»` },
  });

  return NextResponse.json({ ok: true });
}
