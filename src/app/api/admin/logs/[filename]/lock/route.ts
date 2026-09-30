import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { actorFromSession, isValidLogFilename, logEvent, setLogFileLocked } from "@/lib/logger";

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

  // Tampering-adjacent (an unlocked file can then be deleted) — always
  // "security" category regardless of the default for "update", and always
  // logged, on both directions (locking is routine housekeeping, but the
  // guarantee this enforces only matters if unlocking is equally visible).
  await logEvent({
    category: "security",
    actor: actorFromSession(session),
    action: "update",
    target: { type: "log_file", id: params.filename, label: params.filename },
    summary: body.locked ? "قفل شد" : "باز شد",
  });

  return NextResponse.json({ ok: true, locked: body.locked });
}
