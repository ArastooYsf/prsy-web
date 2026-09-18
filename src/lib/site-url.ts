// Single source of truth for the site's absolute base URL — used anywhere an
// absolute link is needed outside the browser (email/SMS bodies, cron
// scripts) where a relative URL wouldn't resolve. Falls back to NEXTAUTH_URL
// (already required for auth callbacks) rather than a hardcoded literal, so
// no environment's address is ever baked into the code.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

/**
 * Absolute URLs (e.g. from a CDN-backed NEXT_PUBLIC_MEDIA_URL, see
 * src/lib/media.ts) are returned untouched; a site-relative path is
 * resolved against SITE_URL. Structured data (JSON-LD) needs fully
 * qualified URLs regardless of which case `getMediaUrl` returns.
 */
export function toAbsoluteUrl(urlOrPath: string): string {
  return /^https?:\/\//.test(urlOrPath) ? urlOrPath : `${SITE_URL}${urlOrPath}`;
}
