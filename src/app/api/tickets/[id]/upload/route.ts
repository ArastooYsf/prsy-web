import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const UPLOAD_SUBDIR = "ticket-attachments";

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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket || (!isStaff && ticket.userId !== session.user.id)) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی ارسال نشده است." }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) && ALLOWED_IMAGE_EXTENSIONS.includes(extension);
  const isPdfFile = file.type === "application/pdf" && extension === ".pdf";

  if (!isImage && !isPdfFile) {
    return NextResponse.json({ error: "فرمت فایل مجاز نیست." }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "حجم فایل بیش از حد مجاز است." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (isImage && !matchesImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: "محتوای فایل با نوع تصویر مطابقت ندارد." }, { status: 400 });
  }
  if (isPdfFile && !isPdf(bytes)) {
    return NextResponse.json({ error: "محتوای فایل با نوع PDF مطابقت ندارد." }, { status: 400 });
  }

  const filename = `${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "media", UPLOAD_SUBDIR);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({ url: `${UPLOAD_SUBDIR}/${filename}`, filename: file.name });
}
