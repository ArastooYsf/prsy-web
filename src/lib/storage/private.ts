import { mkdir, writeFile, unlink } from "fs/promises";
import { createReadStream, type ReadStream } from "fs";
import path from "path";

export const PRIVATE_DIR = process.env.UPLOAD_PRIVATE_DIR || path.join(process.cwd(), "private-uploads");

export type PrivateStorageDriver = {
  put(key: string, bytes: Buffer): Promise<void>;
  createReadStream(key: string): ReadStream;
  delete(key: string): Promise<void>;
};

// Private files always stay on local disk — never driver-switchable, per the
// requirement that they must never be publicly reachable via an external host.
//
// Two key shapes are resolved here: a bare "<uuid>.<ext>" (new uploads, kept
// under UPLOAD_PRIVATE_DIR) and a legacy "uploads/<uuid>.<ext>" (the shape
// every file used before this redesign — still real rows in the local dev
// DB) which is resolved read-only against the old public/media/ location so
// those records keep working without a data migration.
export function resolvePrivateFilePath(storedKey: string): string {
  if (storedKey.includes("..")) {
    throw new Error("Invalid storage key.");
  }
  if (storedKey.includes("/")) {
    return path.join(process.cwd(), "public", "media", storedKey);
  }
  return path.join(PRIVATE_DIR, storedKey);
}

export const privateStorage: PrivateStorageDriver = {
  async put(key, bytes) {
    const dest = resolvePrivateFilePath(key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, bytes);
  },
  createReadStream(key) {
    return createReadStream(resolvePrivateFilePath(key));
  },
  async delete(key) {
    await unlink(resolvePrivateFilePath(key)).catch(() => {});
  },
};
