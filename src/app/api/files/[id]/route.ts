import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buffer } from "stream/consumers";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { privateStorage } from "@/lib/storage/private";
import { mimeFromExtension } from "@/lib/mime-from-extension";

async function respondWithFile(key: string, mimeType: string, filename: string): Promise<NextResponse> {
  // Files are capped at 15MB by validateUploadedFile, so buffering the whole
  // thing is simple and consistent with the existing precedent in
  // src/app/api/admin/contracts/[id]/pdf/route.ts, rather than wiring up a
  // true streaming response for no real benefit at this size.
  let bytes: Buffer;
  try {
    bytes = await buffer(privateStorage.createReadStream(key));
  } catch {
    // DB row exists but the physical file doesn't — e.g. ParsPack's disk
    // isn't persistent, so private-uploads/ can be wiped by a redeploy. A
    // graceful 404 here, not an unhandled 500.
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }
  const disposition = mimeType.startsWith("image/") ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const key = decodeURIComponent(params.id);
  if (key.includes("..") || key.includes("\\")) {
    return NextResponse.json({ error: "شناسه‌ی فایل نامعتبر است." }, { status: 400 });
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";

  // Disambiguates which of the 4 private sources this key belongs to.
  // Order has no correctness impact — keys are globally-unique
  // randomUUID()-derived strings — checked cheapest/most-frequent first.

  const attachment = await prisma.ticketAttachment.findFirst({
    where: { url: key },
    select: { filename: true, mimeType: true, reply: { select: { ticket: { select: { userId: true } } } } },
  });
  if (attachment) {
    if (!isStaff && attachment.reply.ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
    }
    return respondWithFile(key, attachment.mimeType, attachment.filename);
  }

  const customerFile = await prisma.customerFile.findFirst({
    where: { url: key },
    select: { filename: true, mimeType: true, userId: true },
  });
  if (customerFile) {
    if (!isStaff && customerFile.userId !== session.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
    }
    return respondWithFile(key, customerFile.mimeType, customerFile.filename);
  }

  const contract = await prisma.contract.findFirst({
    where: { fileUrl: key, deletedAt: null },
    select: { userId: true, title: true },
  });
  if (contract) {
    if (!isStaff && contract.userId !== session.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
    }
    const ext = path.extname(key);
    return respondWithFile(key, mimeFromExtension(ext), `${contract.title}${ext}`);
  }

  const avatarOwner = await prisma.user.findFirst({ where: { avatarUrl: key }, select: { id: true } });
  if (avatarOwner) {
    if (!isStaff && avatarOwner.id !== session.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
    }
    const ext = path.extname(key);
    return respondWithFile(key, mimeFromExtension(ext), `avatar${ext}`);
  }

  const signedOrder = await prisma.order.findFirst({
    where: { recipientSignatureUrl: key, deletedAt: null },
    select: { userId: true, courierId: true },
  });
  if (signedOrder) {
    if (!isStaff && signedOrder.userId !== session.user.id && signedOrder.courierId !== session.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
    }
    const ext = path.extname(key);
    return respondWithFile(key, mimeFromExtension(ext), `signature${ext}`);
  }

  return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
}
