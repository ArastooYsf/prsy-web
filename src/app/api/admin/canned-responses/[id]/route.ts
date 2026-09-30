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

  const existing = await prisma.cannedResponse.findUnique({ where: { id: params.id } });
  await prisma.cannedResponse.deleteMany({ where: { id: params.id } });

  if (existing) {
    await logEvent({
      actor: actorFromSession(session),
      action: "delete",
      target: { type: "canned_response", id: existing.id, label: existing.title },
    });
  }

  return NextResponse.json({ ok: true });
}
