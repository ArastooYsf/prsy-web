import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DELIVERY_STAGE } from "@/lib/status-labels";

const VALID_STAGES = Object.keys(DELIVERY_STAGE);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "COURIER") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const stage = typeof body?.stage === "string" ? body.stage : "";

  if (!orderId || !VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: "وضعیت نامعتبر است." }, { status: 400 });
  }

  // Same ownership/status check folded into the update's WHERE clause as
  // /api/courier/location — one round trip, no error-message distinction needed.
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, courierId: session.user.id, status: "SHIPPED", deletedAt: null },
    data: { deliveryStage: stage as "PICKED_UP" | "ON_THE_WAY" | "NEARBY" | "ARRIVED" },
  });

  if (count === 0) {
    return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
