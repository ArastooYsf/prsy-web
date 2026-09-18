// carbone's LibreOffice auto-detection (node_modules/carbone/lib/converter.js)
// looks for `soffice.bin` on the OS PATH plus a short list of well-known
// install directories (/opt/libreoffice*/program on Linux) — it never checks
// /usr/lib/libreoffice/program, where this server's apt-installed LibreOffice
// actually lives, so detection silently fails and every render() rejects with
// "Cannot find LibreOffice" even though `soffice`/`soffice.bin` work fine from
// a shell. Prepending the real directory to PATH before carbone is first
// required (see the import order in carbone-client.ts) is enough for its
// which.sync() fallback to find it.
const LIBREOFFICE_PROGRAM_DIR = "/usr/lib/libreoffice/program";

if (!process.env.PATH?.split(":").includes(LIBREOFFICE_PROGRAM_DIR)) {
  process.env.PATH = `${LIBREOFFICE_PROGRAM_DIR}:${process.env.PATH ?? ""}`;
}
