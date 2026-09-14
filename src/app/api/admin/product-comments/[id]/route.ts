import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, logEvent } from "@/lib/logger";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

  await prisma.productComment.delete({ where: { id: comment.id } });

  await logEvent({
    actor: actorFromSession(session),
    action: "delete",
    target: {
      type: "product_comment",
      id: comment.id,
      label: `دیدگاه «${comment.user.name || comment.user.email}» روی «${comment.product.name}»`,
    },
  });

  return NextResponse.json({ ok: true });
}
