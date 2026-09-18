"use client";

import { Download, Printer } from "lucide-react";

type DocumentToolbarProps = {
  pdfHref: string;
};

// Hidden entirely on print (see .no-print in the page's global print style) —
// only the document itself should reach paper/PDF-via-browser-print, never
// these action buttons.
export default function DocumentToolbar({ pdfHref }: DocumentToolbarProps) {
  return (
    <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-end gap-2 px-4">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400"
      >
        <Printer className="size-4" />
        چاپ
      </button>
      <a
        href={pdfHref}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700"
      >
        <Download className="size-4" />
        دانلود PDF
      </a>
    </div>
  );
}
