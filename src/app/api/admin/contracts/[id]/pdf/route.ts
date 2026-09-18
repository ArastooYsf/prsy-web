import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderContractPdf, ContractNotFoundError } from "@/lib/documents/contract-document";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
  if (!isStaff) {
    const contract = await prisma.contract.findFirst({ where: { id: params.id, deletedAt: null }, select: { userId: true } });
    if (!contract || contract.userId !== session.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
    }
  }

  try {
    const { buffer, contractTitle } = await renderContractPdf(params.id);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="contract-${encodeURIComponent(contractTitle)}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ContractNotFoundError) {
      return NextResponse.json({ error: "قرارداد یافت نشد." }, { status: 404 });
    }
    console.error("contract PDF generation failed:", err);
    return NextResponse.json({ error: "خطا در تولید فایل PDF." }, { status: 500 });
  }
}
