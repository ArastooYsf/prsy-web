import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findMediaUsage } from "@/lib/media-usage";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: params.id } });

  if (!asset) {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
  if (!isStaff && asset.uploadedById !== session.user.id) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
  }

  const usage = await findMediaUsage(asset.url);

  return NextResponse.json({ count: usage.length, usage });
}
