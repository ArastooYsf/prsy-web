import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { validateUploadedFile } from "@/lib/uploads";
import { privateStorage } from "@/lib/storage/private";

// Uploads for the 3 private, per-record scopes (ticket attachments, avatars,
// contract files) — no shared gallery/MediaAsset row: the old shared-gallery
// design let staff re-pick ANY previously-uploaded file for a scope across
// unrelated tickets/contracts/customers, which is a cross-record leak once
// these are meant to be private. Each upload here is used immediately by its
// one caller and never staged for reuse elsewhere.
const VALID_SCOPES = ["TICKET_ATTACHMENT", "PROFILE_AVATAR", "CONTRACT_FILE"] as const;
type PrivateScope = (typeof VALID_SCOPES)[number];

// CONTRACT_FILE is staff-managed only (see contracts API routes); the other
// two are legitimately uploaded by any authenticated user (a customer
// attaching a file to their own ticket, anyone setting their own avatar).
const STAFF_ONLY_SCOPES: readonly PrivateScope[] = ["CONTRACT_FILE"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const scopeInput = formData.get("scope");

  if (!VALID_SCOPES.includes(scopeInput as PrivateScope)) {
    return NextResponse.json({ error: "scope نامعتبر است." }, { status: 400 });
  }
  const scope = scopeInput as PrivateScope;

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
  if (STAFF_ONLY_SCOPES.includes(scope) && !isStaff) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی ارسال نشده است." }, { status: 400 });
  }

  const validation = await validateUploadedFile(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { bytes, extension } = validation.result;

  const key = `${randomUUID()}${extension}`;
  await privateStorage.put(key, bytes);

  return NextResponse.json({
    file: { url: key, filename: file.name, mimeType: file.type, size: file.size },
  });
}
