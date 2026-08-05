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
  if (kind === "image") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`shrink-0 ${KIND_COLOR.image} ${className}`}>
        <rect x="4" y="5" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none" />
        <path
          d="M5 16l4.5-4.5a1.5 1.5 0 012.1 0L15 15l1.2-1.2a1.5 1.5 0 012.1 0L20 15.5"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`shrink-0 ${KIND_COLOR[kind]} ${className}`}>
      <path
        d="M8 4h5l5 5v11a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M13 4v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      {kind !== "generic" && (
        <text x="12" y="17.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="currentColor" stroke="none">
          {kind === "pdf" ? "PDF" : "DOC"}
        </text>
      )}
    </svg>
  );
}
