import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const customer = await prisma.user.findFirst({
    where: { id: params.id, role: "CUSTOMER", deletedAt: null },
  });
  if (!customer) {
    return NextResponse.json({ error: "مشتری یافت نشد." }, { status: 404 });
  }

  await prisma.user.update({ where: { id: customer.id }, data: { deletedAt: new Date() } });

  await logEvent({
    actor: { id: session.user.id, email: session.user.email ?? "" },
    action: "delete",
    target: { type: "customer", id: customer.id },
    summary: `مشتری «${customer.name || customer.email}» حذف شد`,
  });

  return NextResponse.json({ ok: true });
}
