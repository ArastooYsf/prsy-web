import { Image as ImageIcon, FilePdf, FileDoc, File as FileIcon } from "@phosphor-icons/react/ssr";

export type FileKind = "pdf" | "docx" | "image" | "generic";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export function fileKindFromMime(mimeType: string): FileKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  return "generic";
}

export function fileKindFromName(name: string): FileKind {
  const lower = name.toLowerCase();
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "image";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "generic";
}

const KIND_COLOR: Record<FileKind, string> = {
  pdf: "text-red-400",
  docx: "text-brand-300",
  image: "text-emerald-400",
  generic: "text-foreground/50",
};

export function FileTypeIcon({ kind, className = "" }: { kind: FileKind; className?: string }) {
  const iconClassName = `shrink-0 ${KIND_COLOR[kind]} ${className}`;
  if (kind === "image") return <ImageIcon size={16} className={iconClassName} />;
  if (kind === "pdf") return <FilePdf size={16} className={iconClassName} />;
  if (kind === "docx") return <FileDoc size={16} className={iconClassName} />;
  return <FileIcon size={16} className={iconClassName} />;
}
