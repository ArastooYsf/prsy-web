import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "COURIER") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const lat = typeof body?.lat === "number" ? body.lat : NaN;
  const lng = typeof body?.lng === "number" ? body.lng : NaN;

  if (!orderId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "اطلاعات موقعیت نامعتبر است." }, { status: 400 });
  }

  // Ownership/status check folded into the update's WHERE clause (no error
  // message here needs to distinguish "not found" from "wrong courier" from
  // "not shipped") — one round trip instead of a read-then-write.
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, courierId: session.user.id, status: "SHIPPED", deletedAt: null },
    data: { courierLat: lat, courierLng: lng, courierLocationUpdatedAt: new Date() },
  });

  if (count === 0) {
    return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
