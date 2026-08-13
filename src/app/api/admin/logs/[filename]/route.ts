import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidLogFilename, readLogFileRaw } from "@/lib/logger";

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  if (!isValidLogFilename(params.filename)) {
    return NextResponse.json({ error: "نام فایل نامعتبر است." }, { status: 400 });
  }

  try {
    const content = await readLogFileRaw(params.filename);
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": `attachment; filename="${params.filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }
}
