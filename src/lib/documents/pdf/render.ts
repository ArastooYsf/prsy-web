import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { registerDocumentFonts } from "@/lib/documents/pdf/fonts";

export async function renderPdfElement(element: ReactElement): Promise<Buffer> {
  registerDocumentFonts();
  return renderToBuffer(element);
}
