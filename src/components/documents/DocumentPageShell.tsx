import DocumentToolbar from "@/components/documents/DocumentToolbar";

type DocumentPageShellProps = {
  pdfHref: string;
  children: React.ReactNode;
};

// Shared wrapper for the print/PDF-preview pages (src/app/documents/**).
// These routes sit outside /account, so the root layout's public Header/
// Footer still render around them on screen — intentional, so the admin/
// customer keeps normal site navigation while just viewing the document.
// The global <style> below hides that chrome (and the toolbar itself) only
// when actually printing, so what reaches paper/PDF is the letterhead alone.
export default function DocumentPageShell({ pdfHref, children }: DocumentPageShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 py-8" dir="rtl">
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          body, .print-page-bg { background: white !important; }
          .print-sheet { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>
      <DocumentToolbar pdfHref={pdfHref} />
      <div className="print-sheet mx-auto max-w-[210mm] rounded-lg bg-white p-[16mm] text-slate-900 shadow-xl">
        {children}
      </div>
    </div>
  );
}
