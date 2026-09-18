import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUploadedFile } from "@/lib/uploads";

const UPLOAD_SUBDIR = "uploads";
const VALID_SCOPES = ["SITE_CONTENT", "TICKET_ATTACHMENT", "PROFILE_AVATAR", "CONTRACT_FILE", "PRODUCT_COMMENT"] as const;
type MediaScope = (typeof VALID_SCOPES)[number];

// SITE_CONTENT is only ever populated through the admin-only site-content/blog
// editor's image picker — without this gate any authenticated user, including
// a CUSTOMER, could tag an upload with this scope directly via the API and
// have it show up in the shared admin gallery. CONTRACT_FILE is the contract
// form's file field, which ADMIN and SUPPORT both manage (see contracts
// API routes), so it's gated to staff rather than ADMIN alone. TICKET_ATTACHMENT
// and PROFILE_AVATAR are legitimately uploaded by every role (a customer
// attaching a file to their own ticket, anyone setting their own avatar).
const ADMIN_ONLY_SCOPES: readonly MediaScope[] = ["SITE_CONTENT"];
const STAFF_ONLY_SCOPES: readonly MediaScope[] = ["CONTRACT_FILE"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const scopeInput = formData.get("scope");
  const scope: MediaScope = VALID_SCOPES.includes(scopeInput as MediaScope) ? (scopeInput as MediaScope) : "SITE_CONTENT";

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
  if (ADMIN_ONLY_SCOPES.includes(scope) && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
  }
  if (STAFF_ONLY_SCOPES.includes(scope) && !isStaff) {
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
  const uploadDir = path.join(process.cwd(), "public", "media", UPLOAD_SUBDIR);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  const relativePath = `${UPLOAD_SUBDIR}/${filename}`;

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
