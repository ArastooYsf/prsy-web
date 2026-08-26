import { mkdir, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { execFileAsync } from "@/lib/exec-file";
import { formatLogFileAsCsv, isValidLogFilename } from "@/lib/logger";

// 7z (p7zip) rather than an npm encryption plugin (e.g. archiver-zip-encrypted):
// it's a real, independently-maintained system tool already used elsewhere
// in this project's own QA workflow (see CLAUDE.md's Lighthouse invocation),
// and its `-tzip -mem=AES256` mode produces a genuine AES-256-encrypted .zip
// — not the weak legacy ZipCrypto that `zip -e`/most pure-JS zip libraries
// fall back to. The trade-off: an AES zip needs 7-Zip/WinRAR/The Unarchiver
// to open — Windows Explorer's and macOS's built-in "Extract" don't support
// AES-encrypted zips — which is the right trade for a real password, not a
// decorative one.
const SEVEN_ZIP_BIN = process.env.SEVEN_ZIP_PATH ?? "7z";

// A clearly-fake placeholder, not a "real-looking" default — anyone who
// forgets to set LOG_EXPORT_PASSWORD gets an export that unmistakably still
// needs configuring, not one that quietly ships with a weak real secret.
const DEFAULT_EXPORT_PASSWORD = "CHANGE_ME_prsy_log_export_password";

// `??` alone treats LOG_EXPORT_PASSWORD="" (set-but-empty) as "use it",
// which would hand 7z a bare `-p` and either produce an unprotected zip or
// hang on stdin — falls back to the placeholder for both "unset" and
// "empty". Callers get `usedPlaceholder` so they can warn instead of
// silently shipping a zip encrypted with a password that's checked into
// this file's source.
function resolveExportPassword(): { password: string; usedPlaceholder: boolean } {
  const envValue = process.env.LOG_EXPORT_PASSWORD;
  if (envValue) return { password: envValue, usedPlaceholder: false };
  return { password: DEFAULT_EXPORT_PASSWORD, usedPlaceholder: true };
}

export type EncryptedLogExportZip = { zip: Buffer; usedPlaceholderPassword: boolean };

/**
 * Builds a password-protected (AES-256) ZIP containing one CSV per log
 * file. Filenames are validated with the same isValidLogFilename()
 * logEvent()/readLogEntries() already enforce, so this can never be pointed
 * outside LOG_DIR.
 */
export async function createEncryptedLogExportZip(filenames: string[]): Promise<EncryptedLogExportZip> {
  const validFilenames = filenames.filter(isValidLogFilename);
  if (validFilenames.length === 0) {
    throw new Error("no valid log filenames given to export");
  }

  const workDir = path.join(os.tmpdir(), `prsy-log-export-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    // Each file's read+format+write is independent — run them together
    // instead of one at a time, same as the dashboard's stats reads.
    const csvNames = await Promise.all(
      validFilenames.map(async (filename) => {
        const csv = await formatLogFileAsCsv(filename);
        const csvName = `${filename.replace(/\.log$/, "")}.csv`;
        await writeFile(path.join(workDir, csvName), csv, "utf8");
        return csvName;
      }),
    );

    const { password, usedPlaceholder } = resolveExportPassword();
    const zipPath = path.join(workDir, "export.zip");
    await execFileAsync(
      SEVEN_ZIP_BIN,
      // -mx=1 (fastest compression): this is already-compact CSV text being
      // shipped as an internal admin export, not a long-term archive — a
      // "category=all" export over many files should stay well under the
      // timeout rather than spend it on maximal compression.
      ["a", "-tzip", "-mx=1", "-mem=AES256", `-p${password}`, "-y", zipPath, ...csvNames],
      { cwd: workDir, timeout: 5 * 60 * 1000 },
    );

    const zip = await readFile(zipPath);
    return { zip, usedPlaceholderPassword: usedPlaceholder };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
