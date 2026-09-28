import type { PublicStorageDriver } from "./public";
import { getMediaUrl } from "@/lib/media";

// Works against any S3-compatible endpoint (not just AWS) via a custom
// endpoint + path-style addressing — e.g. MinIO, Arvan, Liara object storage.
export function createS3Driver(): PublicStorageDriver {
  const bucket = process.env.MEDIA_S3_BUCKET;
  const region = process.env.MEDIA_S3_REGION || "us-east-1";
  const endpoint = process.env.MEDIA_S3_ENDPOINT || undefined;
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY;
  const forcePathStyle = process.env.MEDIA_S3_FORCE_PATH_STYLE !== "false";

  async function getClient() {
    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "MEDIA_STORAGE_DRIVER=s3 اما MEDIA_S3_BUCKET/MEDIA_S3_ACCESS_KEY_ID/MEDIA_S3_SECRET_ACCESS_KEY تنظیم نشده‌اند.",
      );
    }
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({ region, endpoint, forcePathStyle, credentials: { accessKeyId, secretAccessKey } });
  }

  return {
    async put(key, bytes, contentType) {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await getClient();
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType }));
    },
    async delete(key) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await getClient();
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {});
    },
    publicUrl(key) {
      return getMediaUrl(key);
    },
  };
}
