import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, logEvent } from "@/lib/logger";

export async function DELETE(request: Request, { params }: { params: { id: string; fileId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const file = await prisma.customerFile.findFirst({ where: { id: params.fileId, userId: params.id } });
  if (!file) {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }

  await prisma.customerFile.delete({ where: { id: file.id } });

  await logEvent({
    actor: actorFromSession(session),
    action: "delete",
    target: { type: "customer_file", id: file.id, label: `فایل «${file.title}»` },
  });

  return NextResponse.json({ ok: true });
}
