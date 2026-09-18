import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderOrderPdf, OrderNotFoundError } from "@/lib/documents/order-document";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
  if (!isStaff) {
    const order = await prisma.order.findFirst({ where: { id: params.id, deletedAt: null }, select: { userId: true } });
    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
    }
  }

  try {
    const { buffer, orderNumber } = await renderOrderPdf(params.id);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="order-${encodeURIComponent(orderNumber)}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });
    }
    console.error("order PDF generation failed:", err);
    return NextResponse.json({ error: "خطا در تولید فایل PDF." }, { status: 500 });
  }
}
