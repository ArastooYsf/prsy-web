/**
 * Returns a slug guaranteed unique per the caller's `exists` check.
 * `exists(slug)` must resolve true when the slug is already taken
 * (by a different row — the caller scopes that, e.g. `NOT: { id }`).
 */
export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = base || "item";
  if (!(await exists(root))) return root;

  let suffix = 2;
  while (await exists(`${root}-${suffix}`)) {
    suffix += 1;
  }
  return `${root}-${suffix}`;
}
