import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "قرارداد یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const type = typeof body?.type === "string" ? body.type.trim() : "";
  const startDate = typeof body?.startDate === "string" ? new Date(body.startDate) : null;
  const endDate = typeof body?.endDate === "string" ? new Date(body.endDate) : null;
  const status = body?.status === "EXPIRED" ? "EXPIRED" : "ACTIVE";
  const fileUrl = typeof body?.fileUrl === "string" ? body.fileUrl : null;

  if (!userId || !title || !type || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "همه فیلدهای الزامی را پر کنید." }, { status: 400 });
  }

  const customer = await prisma.user.findUnique({ where: { id: userId } });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "مشتری معتبر نیست." }, { status: 400 });
  }

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: { userId, title, type, startDate, endDate, status, fileUrl },
  });

  return NextResponse.json({ contract });
}
