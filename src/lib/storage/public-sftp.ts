import type { PublicStorageDriver } from "./public";
import { getMediaUrl } from "@/lib/media";

// ponytail: one connection per operation, no pooling — fine at this site's
// upload volume; add a persistent connection pool if per-request SFTP
// handshakes ever become a measurable bottleneck.
export function createSftpDriver(): PublicStorageDriver {
  const host = process.env.MEDIA_SFTP_HOST;
  const port = Number(process.env.MEDIA_SFTP_PORT || "22");
  const username = process.env.MEDIA_SFTP_USERNAME;
  const password = process.env.MEDIA_SFTP_PASSWORD;
  const remoteDir = process.env.MEDIA_SFTP_REMOTE_DIR || "media";

  async function withClient<T>(fn: (client: import("ssh2-sftp-client")) => Promise<T>): Promise<T> {
    if (!host || !username || !password) {
      throw new Error(
        "MEDIA_STORAGE_DRIVER=sftp اما MEDIA_SFTP_HOST/MEDIA_SFTP_USERNAME/MEDIA_SFTP_PASSWORD تنظیم نشده‌اند.",
      );
    }
    const SftpClient = (await import("ssh2-sftp-client")).default;
    const client = new SftpClient();
    try {
      await client.connect({ host, port, username, password });
      return await fn(client);
    } finally {
      await client.end().catch(() => {});
    }
  }

  return {
    async put(key, bytes) {
      await withClient(async (client) => {
        const remotePath = `${remoteDir}/${key}`;
        await client.mkdir(`${remoteDir}/${key.split("/").slice(0, -1).join("/")}`, true).catch(() => {});
        await client.put(bytes, remotePath);
      });
    },
    async delete(key) {
      await withClient(async (client) => {
        await client.delete(`${remoteDir}/${key}`).catch(() => {});
      });
    },
    publicUrl(key) {
      return getMediaUrl(key);
    },
  };
}
