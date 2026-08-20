import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15MB (PDF and DOCX)
const UPLOAD_SUBDIR = "uploads";
const VALID_SCOPES = ["SITE_CONTENT", "TICKET_ATTACHMENT", "PROFILE_AVATAR", "CONTRACT_FILE"] as const;
type MediaScope = (typeof VALID_SCOPES)[number];

// Verify actual file bytes, not just the client-supplied name/Content-Type,
// which are trivial to spoof (e.g. a renamed .php file claiming image/jpeg).
function matchesImageSignature(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (mimeType === "image/webp") {
    return (
      bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

function isPdf(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
}

// .docx files are ZIP archives (OOXML); a real ZIP local-file-header signature
// is a reasonable, cheap authenticity check without parsing the archive.
function isZipContainer(bytes: Buffer): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const scopeInput = formData.get("scope");
  const scope: MediaScope = VALID_SCOPES.includes(scopeInput as MediaScope) ? (scopeInput as MediaScope) : "SITE_CONTENT";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی ارسال نشده است." }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();
  const isImageCandidate = ALLOWED_IMAGE_TYPES.includes(file.type) && ALLOWED_IMAGE_EXTENSIONS.includes(extension);
  const isPdfCandidate = file.type === "application/pdf" && extension === ".pdf";
  const isDocxCandidate = file.type === DOCX_MIME_TYPE && extension === ".docx";

  if (!isImageCandidate && !isPdfCandidate && !isDocxCandidate) {
    return NextResponse.json({ error: "فرمت فایل مجاز نیست." }, { status: 400 });
  }

  const maxSize = isImageCandidate ? MAX_IMAGE_SIZE_BYTES : MAX_DOCUMENT_SIZE_BYTES;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "حجم فایل بیش از حد مجاز است." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (isImageCandidate && !matchesImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: "محتوای فایل با نوع تصویر مطابقت ندارد." }, { status: 400 });
  }
  if (isPdfCandidate && !isPdf(bytes)) {
    return NextResponse.json({ error: "محتوای فایل با نوع PDF مطابقت ندارد." }, { status: 400 });
  }
  if (isDocxCandidate && !isZipContainer(bytes)) {
    return NextResponse.json({ error: "محتوای فایل با نوع DOCX مطابقت ندارد." }, { status: 400 });
  }

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
