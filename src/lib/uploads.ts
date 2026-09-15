import path from "path";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15MB (PDF and DOCX)

export type ValidatedUpload = {
  bytes: Buffer;
  extension: string;
};

// Verify actual file bytes, not just the client-supplied name/Content-Type,
// which are trivial to spoof (e.g. a renamed .php file claiming image/jpeg).
function matchesImageSignature(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (mimeType === "image/webp") {
    return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

function isPdf(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
}

// .docx files are ZIP archives (OOXML); a real ZIP local-file-header signature
// is a reasonable, cheap authenticity check without parsing the archive.
function isZipContainer(bytes: Buffer): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

// Shared by every upload endpoint that accepts an image, PDF, or DOCX
// (site-content/contract media picker, customer-file attachments, …) so the
// signature checks below live in exactly one place.
export async function validateUploadedFile(file: File): Promise<{ ok: true; result: ValidatedUpload } | { ok: false; error: string }> {
  const extension = path.extname(file.name).toLowerCase();
  const isImageCandidate = ALLOWED_IMAGE_TYPES.includes(file.type) && ALLOWED_IMAGE_EXTENSIONS.includes(extension);
  const isPdfCandidate = file.type === "application/pdf" && extension === ".pdf";
  const isDocxCandidate = file.type === DOCX_MIME_TYPE && extension === ".docx";

  if (!isImageCandidate && !isPdfCandidate && !isDocxCandidate) {
    return { ok: false, error: "فرمت فایل مجاز نیست." };
  }

  const maxSize = isImageCandidate ? MAX_IMAGE_SIZE_BYTES : MAX_DOCUMENT_SIZE_BYTES;
  if (file.size > maxSize) {
    return { ok: false, error: "حجم فایل بیش از حد مجاز است." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (isImageCandidate && !matchesImageSignature(bytes, file.type)) {
    return { ok: false, error: "محتوای فایل با نوع تصویر مطابقت ندارد." };
  }
  if (isPdfCandidate && !isPdf(bytes)) {
    return { ok: false, error: "محتوای فایل با نوع PDF مطابقت ندارد." };
  }
  if (isDocxCandidate && !isZipContainer(bytes)) {
    return { ok: false, error: "محتوای فایل با نوع DOCX مطابقت ندارد." };
  }

  return { ok: true, result: { bytes, extension } };
}
