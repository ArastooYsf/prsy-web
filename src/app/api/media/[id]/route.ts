import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/uploaded-files";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: params.id },
    include: { uploadedBy: { select: { role: true } } },
  });

  if (!asset) {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }

  const canDelete =
    session.user.role === "ADMIN" ||
    asset.uploadedById === session.user.id ||
    (session.user.role === "SUPPORT" && (asset.uploadedBy?.role === "CUSTOMER" || asset.uploadedById === null));

  if (!canDelete) {
    return NextResponse.json({ error: "اجازه حذف این فایل را ندارید." }, { status: 403 });
  }

  const result = await deleteUploadedFile("media_asset", asset.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
