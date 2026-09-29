import { prisma } from "@/lib/prisma";
import { param, dateRangeWhere, type ListSearchParams } from "@/lib/list-query";
import { getPublicStorage } from "@/lib/storage/public";
import { privateStorage } from "@/lib/storage/private";
import { findMediaUsage } from "@/lib/media-usage";

// The four tables that actually track one row per uploaded file with full
// filename/mimeType/size/createdAt metadata. Ticket attachments and product-
// comment images are private/public *content* history (see the soft-delete
// note on `deletable` below) — profile avatars, contract files, and brand/
// site logos are bare URL strings on their owning record with no per-file
// row at all, so there's nothing to list for them independent of that record.
export type UploadedFileSource = "media_asset" | "customer_file" | "ticket_attachment" | "product_comment_image";

export type UploadedFileRow = {
  id: string;
  source: UploadedFileSource;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  isPrivate: boolean;
  sourceLabel: string;
  contextLabel: string;
  // Only media_asset and customer_file are standalone resources meant to be
  // individually deletable. Ticket attachments and product-comment images
  // are part of a reply/comment's own (soft-deleted-only) history — the rest
  // of this codebase deliberately never hard-deletes those rows or their
  // files (see TicketReply/ProductComment's own doc comments), so this page
  // shows them for visibility but routes deletion through that reply/comment
  // instead of offering a silent per-attachment hard delete here.
  deletable: boolean;
};

const SOURCE_LABEL: Record<UploadedFileSource, string> = {
  media_asset: "مخزن سایت",
  customer_file: "فایل مشتری",
  ticket_attachment: "پیوست تیکت",
  product_comment_image: "تصویر دیدگاه محصول",
};

const MEDIA_SCOPE_LABEL: Record<string, string> = {
  SITE_CONTENT: "محتوای سایت",
  PRODUCT_COMMENT: "نظر محصول",
  // Not created by any current upload path (see src/app/api/uploads/private —
  // those three scopes skip the MediaAsset table entirely) but old rows may
  // still exist from before that split.
  TICKET_ATTACHMENT: "پیوست تیکت (قدیمی)",
  PROFILE_AVATAR: "آواتار (قدیمی)",
  CONTRACT_FILE: "قرارداد (قدیمی)",
};

export type UploadedFileType = "image" | "pdf" | "docx";

function mimeWhereForType(type: string | undefined) {
  if (type === "image") return { mimeType: { startsWith: "image/" } };
  if (type === "pdf") return { mimeType: "application/pdf" };
  if (type === "docx") return { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  return {};
}

export type UploadedFileFilters = {
  type?: string;
  source?: string;
  createdAt?: { gte?: Date; lte?: Date };
  minSize?: number;
  maxSize?: number;
};

function parseMbParam(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n * 1024 * 1024 : undefined;
}

export function parseUploadedFileFilters(searchParams: ListSearchParams): UploadedFileFilters {
  return {
    type: param(searchParams, "type"),
    source: param(searchParams, "source"),
    createdAt: dateRangeWhere(searchParams, "from", "to"),
    minSize: parseMbParam(param(searchParams, "minSize")),
    maxSize: parseMbParam(param(searchParams, "maxSize")),
  };
}

// Per-table cap — this is an admin audit tool, not a paginated-at-the-database
// level report, so results are fetched, merged across the 4 tables, sorted,
// and paginated in memory. A few thousand rows per table is comfortably
// cheap for a single Node process and far more than any of these tables
// realistically hold; revisit with a real DB-level UNION if that changes.
const FETCH_CAP = 3000;

export async function listUploadedFiles(filters: UploadedFileFilters): Promise<UploadedFileRow[]> {
  const mimeWhere = mimeWhereForType(filters.type);
  const sizeWhere: { gte?: number; lte?: number } = {};
  if (filters.minSize !== undefined) sizeWhere.gte = filters.minSize;
  if (filters.maxSize !== undefined) sizeWhere.lte = filters.maxSize;
  const sizeFilter = Object.keys(sizeWhere).length > 0 ? { size: sizeWhere } : {};
  const dateFilter = filters.createdAt ? { createdAt: filters.createdAt } : {};
  const common = { ...mimeWhere, ...sizeFilter, ...dateFilter };

  const wantSource = (s: UploadedFileSource) => !filters.source || filters.source === s;

  const [mediaAssets, customerFiles, ticketAttachments, commentImages] = await Promise.all([
    wantSource("media_asset")
      ? prisma.mediaAsset.findMany({ where: common, orderBy: { createdAt: "desc" }, take: FETCH_CAP })
      : Promise.resolve([]),
    wantSource("customer_file")
      ? prisma.customerFile.findMany({
          where: common,
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: FETCH_CAP,
        })
      : Promise.resolve([]),
    wantSource("ticket_attachment")
      ? prisma.ticketAttachment.findMany({
          where: common,
          include: { reply: { select: { deletedAt: true, ticket: { select: { subject: true } } } } },
          orderBy: { createdAt: "desc" },
          take: FETCH_CAP,
        })
      : Promise.resolve([]),
    wantSource("product_comment_image")
      ? prisma.productCommentImage.findMany({
          where: common,
          include: { comment: { select: { deletedAt: true, product: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
          take: FETCH_CAP,
        })
      : Promise.resolve([]),
  ]);

  const rows: UploadedFileRow[] = [
    ...mediaAssets.map((a): UploadedFileRow => ({
      id: a.id,
      source: "media_asset",
      filename: a.filename,
      url: a.url,
      mimeType: a.mimeType,
      size: a.size,
      createdAt: a.createdAt,
      isPrivate: false,
      sourceLabel: MEDIA_SCOPE_LABEL[a.scope] ?? a.scope,
      contextLabel: "",
      deletable: true,
    })),
    ...customerFiles.map((f): UploadedFileRow => ({
      id: f.id,
      source: "customer_file",
      filename: f.filename,
      url: f.url,
      mimeType: f.mimeType,
      size: f.size,
      createdAt: f.createdAt,
      isPrivate: true,
      sourceLabel: SOURCE_LABEL.customer_file,
      contextLabel: `مشتری: ${f.user.name || f.user.email}`,
      deletable: true,
    })),
    ...ticketAttachments.map((a): UploadedFileRow => ({
      id: a.id,
      source: "ticket_attachment",
      filename: a.filename,
      url: a.url,
      mimeType: a.mimeType,
      size: a.size,
      createdAt: a.createdAt,
      isPrivate: true,
      sourceLabel: SOURCE_LABEL.ticket_attachment,
      contextLabel: `تیکت: ${a.reply.ticket.subject}${a.reply.deletedAt ? " (پیام حذف‌شده)" : ""}`,
      deletable: false,
    })),
    ...commentImages.map((img): UploadedFileRow => ({
      id: img.id,
      source: "product_comment_image",
      filename: img.filename,
      url: img.url,
      mimeType: img.mimeType,
      size: img.size,
      createdAt: img.createdAt,
      isPrivate: false,
      sourceLabel: SOURCE_LABEL.product_comment_image,
      contextLabel: `محصول: ${img.comment.product.name}${img.comment.deletedAt ? " (دیدگاه حذف‌شده)" : ""}`,
      deletable: false,
    })),
  ];

  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows;
}

export async function getUploadedFileUsage(source: UploadedFileSource, id: string) {
  if (source === "media_asset") {
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return null;
    return findMediaUsage(asset.url);
  }
  if (source === "customer_file") {
    // A customer file is a standalone document nothing else ever embeds by
    // URL (unlike a MediaAsset picked into a product/blog/site-content
    // field) — it's always exactly and only "the file record for customer
    // X", so there's nothing else to check.
    return [];
  }
  return null;
}

export async function deleteUploadedFile(source: UploadedFileSource, id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (source === "media_asset") {
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return { ok: false, error: "فایل یافت نشد." };
    await prisma.mediaAsset.delete({ where: { id } });
    const storage = await getPublicStorage();
    await storage.delete(asset.url);
    return { ok: true };
  }
  if (source === "customer_file") {
    const file = await prisma.customerFile.findUnique({ where: { id } });
    if (!file) return { ok: false, error: "فایل یافت نشد." };
    await prisma.customerFile.delete({ where: { id } });
    await privateStorage.delete(file.url);
    return { ok: true };
  }
  return { ok: false, error: "این نوع فایل از این صفحه قابل حذف نیست — پیام/دیدگاه مربوطه را حذف کنید." };
}
