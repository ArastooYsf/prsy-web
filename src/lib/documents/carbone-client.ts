import "./setup-libreoffice-path";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- carbone (v3, CJS-only, no types) must load after the PATH patch above runs
const carbone = require("carbone");

// Promisified wrapper around carbone's callback-based render() — merges the
// Carbone template's {d.*} tags with `data` and converts the result to PDF
// via the server's local LibreOffice install (see setup-libreoffice-path.ts).
export function renderPdf(templatePath: string, data: unknown): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    carbone.render(templatePath, data, { convertTo: "pdf" }, (err: Error | null, result: Buffer) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
