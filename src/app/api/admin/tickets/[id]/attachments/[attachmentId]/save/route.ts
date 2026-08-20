import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Copies a ticket attachment's file reference into the staff viewer's personal
// media library — same url/filename/mimeType/size, no physical re-upload.
// Kept in TICKET_ATTACHMENT scope (not SITE_CONTENT) so a one-click save from
// a chat doesn't silently promote a customer's file into the site gallery.
export async function POST(request: Request, { params }: { params: { id: string; attachmentId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const attachment = await prisma.ticketAttachment.findFirst({
    where: { id: params.attachmentId, reply: { ticketId: params.id } },
  });

  if (!attachment) {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }

  const media = await prisma.mediaAsset.create({
    data: {
      filename: attachment.filename,
      url: attachment.url,
      mimeType: attachment.mimeType,
      size: attachment.size,
      scope: "TICKET_ATTACHMENT",
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, media: { id: media.id, url: media.url, filename: media.filename } });
}
