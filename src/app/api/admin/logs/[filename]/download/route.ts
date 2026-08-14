import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatLogFileAsText, isValidLogFilename } from "@/lib/logger";

// Export as a clean, readable text report — never the raw JSON Lines.
export async function GET(request: Request, { params }: { params: { filename: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  if (!isValidLogFilename(params.filename)) {
    return NextResponse.json({ error: "نام فایل نامعتبر است." }, { status: 400 });
  }

  try {
    const text = await formatLogFileAsText(params.filename);
    const downloadName = params.filename.replace(/\.log$/, ".txt");
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }
}
