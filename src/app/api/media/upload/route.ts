import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUploadedFile } from "@/lib/uploads";
import { getPublicStorage } from "@/lib/storage/public";

const UPLOAD_SUBDIR = "uploads";

// TICKET_ATTACHMENT, PROFILE_AVATAR and CONTRACT_FILE are private scopes —
// they go through /api/uploads/private instead (never public, no shared
// gallery). Only these two genuinely-public scopes are handled here.
const VALID_SCOPES = ["SITE_CONTENT", "PRODUCT_COMMENT"] as const;
type MediaScope = (typeof VALID_SCOPES)[number];

// SITE_CONTENT is only ever populated through the admin-only site-content/blog
// editor's image picker — without this gate any authenticated user, including
// a CUSTOMER, could tag an upload with this scope directly via the API and
// have it show up in the shared admin gallery.
const ADMIN_ONLY_SCOPES: readonly MediaScope[] = ["SITE_CONTENT"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const scopeInput = formData.get("scope");

  if (!VALID_SCOPES.includes(scopeInput as MediaScope)) {
    return NextResponse.json({ error: "این scope دیگر از این مسیر پشتیبانی نمی‌شود — از /api/uploads/private استفاده کنید." }, { status: 400 });
  }
  const scope = scopeInput as MediaScope;

  if (ADMIN_ONLY_SCOPES.includes(scope) && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی ارسال نشده است." }, { status: 400 });
  }

  const validation = await validateUploadedFile(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { bytes, extension } = validation.result;

  const filename = `${randomUUID()}${extension}`;
  const relativePath = `${UPLOAD_SUBDIR}/${filename}`;

  const storage = await getPublicStorage();
  await storage.put(relativePath, bytes, file.type);

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: file.name,
      url: relativePath,
      mimeType: file.type,
      size: file.size,
      scope,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({
    media: { id: asset.id, url: asset.url, filename: asset.filename, mimeType: asset.mimeType, size: asset.size, canDelete: true },
  });
}
