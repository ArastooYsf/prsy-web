import { withSentryConfig } from "@sentry/nextjs";

// When NEXT_PUBLIC_MEDIA_URL points at an external download host instead of
// the default relative "/media", next/image needs that host allow-listed —
// derived here so switching hosts later doesn't also need a manual
// remotePatterns edit. No-op for the default relative value.
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL || "/media";
const remotePatterns = [];
if (/^https?:\/\//i.test(mediaUrl)) {
  const parsed = new URL(mediaUrl);
  remotePatterns.push({ protocol: parsed.protocol.replace(":", ""), hostname: parsed.hostname });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns },
  // ssh2 (a dependency of ssh2-sftp-client, used only when
  // MEDIA_STORAGE_DRIVER=sftp — src/lib/storage/public-sftp.ts) ships a
  // native .node binary that webpack can't bundle. This tells Next to
  // require() it at runtime instead of trying to bundle it, which is the
  // documented fix for native addons in server-side route code.
  experimental: {
    serverComponentsExternalPackages: ["ssh2-sftp-client", "ssh2"],
  },
};

export default withSentryConfig(nextConfig, {
  // Only needed for source-map upload (readable stack traces in the Sentry
  // UI). Until these three are set, the plugin just skips that step —
  // the build itself doesn't fail or need them.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
