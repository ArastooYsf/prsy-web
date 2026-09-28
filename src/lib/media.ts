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

/** Builds the URL for a private file (ticket attachment, contract, avatar,
 * customer file) — always the permission-checked API route, never a direct
 * public path. See src/app/api/files/[id]/route.ts. */
export function getPrivateFileUrl(key: string): string {
  return `/api/files/${encodeURIComponent(key)}`;
}

/** For admin-pasted "download host" values (Product.catalogUrl, site-content
 * downloads) which may already be an absolute URL to an external host, or a
 * relative path meant to resolve against the current public media base. */
export function resolveMediaUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : getMediaUrl(value);
}
