import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_SCOPES = ["SITE_CONTENT", "TICKET_ATTACHMENT", "PROFILE_AVATAR", "CONTRACT_FILE"] as const;
type MediaScope = (typeof VALID_SCOPES)[number];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "all";
  const scopeParam = searchParams.get("scope");
  const scope: MediaScope = VALID_SCOPES.includes(scopeParam as MediaScope) ? (scopeParam as MediaScope) : "SITE_CONTENT";
  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";

  const mimeFilter =
    type === "image"
      ? { mimeType: { startsWith: "image/" } }
      : type === "file"
        ? { mimeType: { not: { startsWith: "image/" } } }
        : {};

  // Staff gets the shared bucket for that scope (e.g. every SITE_CONTENT upload,
  // regardless of which admin/support user uploaded it) — but never another
  // scope's files (customer ticket attachments, avatars, contract PDFs).
  // Non-staff only ever sees their own uploads within the requested scope.
  const assets = await prisma.mediaAsset.findMany({
    where: {
      scope,
      ...(isStaff ? {} : { uploadedById: session.user.id }),
      ...mimeFilter,
    },
    include: { uploadedBy: { select: { id: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const media = assets.map((asset) => ({
    id: asset.id,
    url: asset.url,
    filename: asset.filename,
    mimeType: asset.mimeType,
    size: asset.size,
    canDelete:
      session.user.role === "ADMIN" ||
      asset.uploadedById === session.user.id ||
      (session.user.role === "SUPPORT" && (asset.uploadedBy?.role === "CUSTOMER" || asset.uploadedById === null)),
  }));

  return NextResponse.json({ media });
}
