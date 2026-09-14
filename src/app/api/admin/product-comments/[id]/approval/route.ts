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

  const comment = await prisma.productComment.findUnique({
    where: { id: params.id },
    include: { product: true, user: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "دیدگاه یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action === "APPROVE" ? "APPROVED" : body?.action === "REJECT" ? "REJECTED" : null;

  if (!action) {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  const updated = await prisma.productComment.update({
    where: { id: comment.id },
    data: { status: action },
  });

  await logEvent({
    actor: actorFromSession(session),
    action: "approval_change",
    target: {
      type: "product_comment",
      id: updated.id,
      label: `دیدگاه «${comment.user.name || comment.user.email}» روی «${comment.product.name}»`,
    },
    summary: `به «${APPROVAL_STATUS[action]?.label ?? action}»`,
  });

  return NextResponse.json({ comment: { id: updated.id, status: updated.status } });
}
