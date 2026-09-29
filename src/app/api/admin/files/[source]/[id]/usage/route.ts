import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUploadedFileUsage, type UploadedFileSource } from "@/lib/uploaded-files";

const CHECKABLE_SOURCES: readonly UploadedFileSource[] = ["media_asset", "customer_file"];

function isCheckableSource(value: string): value is UploadedFileSource {
  return (CHECKABLE_SOURCES as readonly string[]).includes(value);
}

export async function GET(request: Request, { params }: { params: { source: string; id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
  }

  if (!isCheckableSource(params.source)) {
    return NextResponse.json({ error: "نوع فایل نامعتبر است." }, { status: 400 });
  }

  const usage = await getUploadedFileUsage(params.source, params.id);
  if (usage === null) {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({ count: usage.length, usage });
}
