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

  try {
    await setLogFileLocked(params.filename, body.locked);
  } catch (err) {
    // setLogFileLocked is the enforcement point for "crash/access/security
    // can never be unlocked" (see src/lib/logger.ts) — it throws rather than
    // silently no-op-ing, so that guarantee can't be bypassed by a caller
    // that ignores the return value. Surfaced here as 403, not a generic 500.
    const message = err instanceof Error ? err.message : "این عملیات مجاز نیست.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return NextResponse.json({ ok: true, locked: body.locked });
}
