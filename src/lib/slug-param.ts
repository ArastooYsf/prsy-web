// Next.js 14 App Router does not URL-decode non-ASCII dynamic route params
// (confirmed directly: params.slug arrives as the raw percent-encoded string,
// e.g. "%D8%AF..." instead of the decoded Persian text). Since most slugs in
// this app are Persian, every dynamic `[slug]` route must decode before using
// a param to look anything up. Falls back to the raw value on a malformed
// sequence rather than throwing, so a garbage URL just 404s instead of 500ing.
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
