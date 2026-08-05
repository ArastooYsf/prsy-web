import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const UPLOAD_SUBDIR = "contracts";

// Verify actual file bytes, not just the client-supplied name/Content-Type,
// which are trivial to spoof (e.g. a renamed .php file claiming application/pdf).
function isPdf(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی ارسال نشده است." }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();

  if (file.type !== "application/pdf" || extension !== ".pdf") {
    return NextResponse.json({ error: "فرمت فایل مجاز نیست." }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "حجم فایل بیش از حد مجاز است." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (!isPdf(bytes)) {
    return NextResponse.json({ error: "محتوای فایل با نوع PDF مطابقت ندارد." }, { status: 400 });
  }

  const filename = `${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "media", UPLOAD_SUBDIR);
  await mkdir(uploadDir, { recursive: true });

  await writeFile(path.join(uploadDir, filename), bytes);

  const relativePath = `${UPLOAD_SUBDIR}/${filename}`;

  return NextResponse.json({ url: relativePath });
}
