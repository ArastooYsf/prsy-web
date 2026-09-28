import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { getMediaUrl } from "@/lib/media";

export type PublicStorageDriver = {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
};

const localDriver: PublicStorageDriver = {
  async put(key, bytes) {
    const dest = path.join(process.cwd(), "public", "media", key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, bytes);
  },
  async delete(key) {
    await unlink(path.join(process.cwd(), "public", "media", key)).catch(() => {});
  },
  publicUrl(key) {
    return getMediaUrl(key);
  },
};

let cached: PublicStorageDriver | null = null;

// Driver chosen once per process and memoized — MEDIA_STORAGE_DRIVER doesn't
// change at runtime, so there's no reason to re-read it or re-import the
// sftp/s3 modules on every upload. "sftp"/"s3" are dynamically imported so
// their SDKs (and the credentials they'd otherwise require) are never
// touched at all when the driver is "local" (the default).
export async function getPublicStorage(): Promise<PublicStorageDriver> {
  if (cached) return cached;

  const driver = process.env.MEDIA_STORAGE_DRIVER || "local";
  if (driver === "sftp") {
    const { createSftpDriver } = await import("./public-sftp");
    cached = createSftpDriver();
  } else if (driver === "s3") {
    const { createS3Driver } = await import("./public-s3");
    cached = createS3Driver();
  } else {
    cached = localDriver;
  }
  return cached;
}
