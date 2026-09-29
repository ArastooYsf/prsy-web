import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { actorFromSession, logEvent } from "@/lib/logger";
import { deleteUploadedFile, type UploadedFileSource } from "@/lib/uploaded-files";

const DELETABLE_SOURCES: readonly UploadedFileSource[] = ["media_asset", "customer_file"];

function isDeletableSource(value: string): value is UploadedFileSource {
  return (DELETABLE_SOURCES as readonly string[]).includes(value);
}

export async function DELETE(request: Request, { params }: { params: { source: string; id: string } }) {
  const session = await getServerSession(authOptions);

  // ADMIN-only: this endpoint can delete any file site-wide (any customer's
  // documents, any product image, the site logo, ...), unlike the per-scope
  // delete routes it reuses which also allow the original uploader/SUPPORT.
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
  }

  if (!isDeletableSource(params.source)) {
    return NextResponse.json({ error: "این نوع فایل از این صفحه قابل حذف نیست." }, { status: 400 });
  }

  const result = await deleteUploadedFile(params.source, params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  await logEvent({
    actor: actorFromSession(session),
    action: "delete",
    target: { type: "uploaded_file", id: params.id, label: `فایل (${params.source}) از صفحه‌ی مدیریت فایل‌ها` },
  });

  return NextResponse.json({ ok: true });
}
