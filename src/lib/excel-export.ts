import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export type ExcelColumn<T> = {
  header: string;
  width?: number;
  value: (row: T) => string | number;
};

export async function buildExcelResponse<T>(
  sheetName: string,
  filename: string,
  columns: ExcelColumn<T>[],
  rows: T[],
): Promise<NextResponse> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName, { views: [{ rightToLeft: true }] });

  sheet.columns = columns.map((col) => ({ header: col.header, width: col.width ?? 22 }));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(columns.map((col) => col.value(row)));
  }

  const buffer = await workbook.xlsx.writeBuffer();

  // Content-Disposition header values must be ByteString (Latin1) — the
  // Persian filename has to go through the RFC 5987 filename* form, with a
  // plain-ASCII fallback in filename= for older clients.
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
    },
  });
}
