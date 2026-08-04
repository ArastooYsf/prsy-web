const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL ?? "/media";

/**
 * Resolves a relative media path (e.g. "products/diesel-generators.jpg")
 * against NEXT_PUBLIC_MEDIA_URL. Change that one env var to move all
 * product images/videos to an external host — no component changes needed.
 */
export function getMediaUrl(path: string): string {
  const base = MEDIA_BASE_URL.replace(/\/+$/, "");
  const clean = path.replace(/^\/+/, "");
  return `${base}/${clean}`;
}
