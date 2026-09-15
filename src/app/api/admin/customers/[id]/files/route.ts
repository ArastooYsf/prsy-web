import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUploadedFile } from "@/lib/uploads";
import { actorFromSession, logEvent } from "@/lib/logger";

const UPLOAD_SUBDIR = "uploads";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const files = await prisma.customerFile.findMany({
    where: { userId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ files });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const customer = await prisma.user.findFirst({ where: { id: params.id, role: "CUSTOMER", deletedAt: null } });
  if (!customer) {
    return NextResponse.json({ error: "مشتری یافت نشد." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const titleInput = formData.get("title");

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

  const title = typeof titleInput === "string" && titleInput.trim() ? titleInput.trim().slice(0, 191) : file.name;

  const customerFile = await prisma.customerFile.create({
    data: {
      userId: customer.id,
      title,
      url: `${UPLOAD_SUBDIR}/${filename}`,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedById: session.user.id,
    },
  });

  await logEvent({
    actor: actorFromSession(session),
    action: "create",
    target: { type: "customer_file", id: customerFile.id, label: `فایل «${title}» برای مشتری «${customer.name || customer.email}»` },
  });

  return NextResponse.json({ file: customerFile });
}
