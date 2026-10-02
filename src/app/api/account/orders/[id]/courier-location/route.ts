import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
    select: { status: true, courierLat: true, courierLng: true, courierLocationUpdatedAt: true },
  });

  if (!order) {
    return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    lat: order.courierLat,
    lng: order.courierLng,
    updatedAt: order.courierLocationUpdatedAt,
  });
}
