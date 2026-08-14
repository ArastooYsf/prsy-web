import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidLogFilename, setLogFileLocked } from "@/lib/logger";

export async function PATCH(request: Request, { params }: { params: { filename: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  if (!isValidLogFilename(params.filename)) {
    return NextResponse.json({ error: "نام فایل نامعتبر است." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.locked !== "boolean") {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  await setLogFileLocked(params.filename, body.locked);

  return NextResponse.json({ ok: true, locked: body.locked });
}
