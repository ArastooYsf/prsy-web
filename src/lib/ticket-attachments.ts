export const MAX_ATTACHMENTS_PER_REPLY = 10;

export type AttachmentInput = {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

// Validates/normalizes the client-supplied attachments array for a ticket
// reply. Each entry comes from a prior /api/media/upload call, so we only
// trust the shape here, not re-verify the file itself.
export function parseAttachmentsInput(input: unknown): AttachmentInput[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(
      (a): a is AttachmentInput =>
        !!a &&
        typeof a === "object" &&
        typeof (a as AttachmentInput).url === "string" &&
        typeof (a as AttachmentInput).filename === "string" &&
        typeof (a as AttachmentInput).mimeType === "string" &&
        typeof (a as AttachmentInput).size === "number",
    )
    .slice(0, MAX_ATTACHMENTS_PER_REPLY)
    .map((a) => ({
      url: a.url,
      filename: a.filename.slice(0, 200),
      mimeType: a.mimeType,
      size: a.size,
    }));
}
