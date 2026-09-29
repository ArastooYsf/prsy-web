import { formatFileSize } from "@/lib/format-number";
import { formatJalaliDateTime } from "@/lib/jalali";
import { getMediaUrl, getPrivateFileUrl } from "@/lib/media";
import { FileTypeIcon, fileKindFromMime } from "@/components/FileTypeIcon";
import UploadedFileDeleteButton from "@/components/admin/UploadedFileDeleteButton";
import type { UploadedFileRow as UploadedFileRowData } from "@/lib/uploaded-files";

function fileHref(row: UploadedFileRowData) {
  return row.isPrivate ? getPrivateFileUrl(row.url) : getMediaUrl(row.url);
}

function DeleteOrHint({ row }: { row: UploadedFileRowData }) {
  if (row.deletable) {
    return <UploadedFileDeleteButton source={row.source} id={row.id} filename={row.filename} />;
  }
  // Ticket attachments / product-comment images live inside a reply's or
  // comment's own history — deleting them here would silently rewrite that
  // history, so this page only offers the reversible, audited path: delete
  // the reply/comment itself (soft-delete, same as everywhere else in the app).
  return <span className="text-[11px] text-foreground/40">فقط با حذف پیام/دیدگاه مربوطه</span>;
}

export function UploadedFileCardMobile({ row }: { row: UploadedFileRowData }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <a
          href={fileHref(row)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground/80 hover:text-accent-400"
        >
          <FileTypeIcon kind={fileKindFromMime(row.mimeType)} />
          <span className="truncate">{row.filename}</span>
        </a>
        <DeleteOrHint row={row} />
      </div>
      <dl className="mt-2 space-y-1 text-xs text-foreground/50">
        <p>
          {row.sourceLabel}
          {row.contextLabel ? ` — ${row.contextLabel}` : ""}
        </p>
        <p dir="ltr" className="text-right">
          {formatFileSize(row.size)} · {formatJalaliDateTime(row.createdAt)}
        </p>
      </dl>
    </div>
  );
}

export function UploadedFileRowDesktop({ row }: { row: UploadedFileRowData }) {
  return (
    <tr className="border-t border-foreground/10 transition-colors hover:bg-foreground/[0.03]">
      <td className="px-4 py-3">
        <a
          href={fileHref(row)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground/80 hover:text-accent-400"
        >
          <FileTypeIcon kind={fileKindFromMime(row.mimeType)} />
          <span className="max-w-xs truncate">{row.filename}</span>
        </a>
      </td>
      <td className="px-4 py-3 text-xs text-foreground/60">
        {row.sourceLabel}
        {row.contextLabel && <span className="block text-foreground/40">{row.contextLabel}</span>}
      </td>
      <td className="px-4 py-3 text-xs text-foreground/50">{formatFileSize(row.size)}</td>
      <td dir="ltr" className="px-4 py-3 text-right text-xs text-foreground/50">
        {formatJalaliDateTime(row.createdAt)}
      </td>
      <td className="px-4 py-3">
        <DeleteOrHint row={row} />
      </td>
    </tr>
  );
}
