import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";

const APP_DIR = path.join(process.cwd(), "src", "app");
const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/;

// Route prefixes that are auth-gated, session-specific, or utility-only —
// mirrors src/app/robots.ts's disallow list. These already carry a
// page-level `noindex` (see e.g. src/app/account/layout.tsx), so listing
// them here would only earn a "submitted URL marked noindex" warning in
// Search Console for zero indexing benefit.
const EXCLUDED_PREFIXES = ["/account", "/login", "/register", "/cart", "/documents", "/forbidden", "/maintenance"];

/**
 * Walks src/app and collects every STATIC route that has a page file, so a
 * newly added public page shows up here automatically with no edits to this
 * file. Route groups "(name)" are unwrapped; dynamic segments "[slug]" are
 * skipped here since they need real param values — those come from the
 * database queries below instead.
 */
function discoverStaticRoutes(dir: string, urlPrefix = ""): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes: string[] = [];

  if (entries.some((entry) => entry.isFile() && PAGE_FILE.test(entry.name))) {
    routes.push(urlPrefix === "" ? "/" : urlPrefix);
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    if (entry.name.startsWith("[")) continue;

    const childDir = path.join(dir, entry.name);
    const isRouteGroup = entry.name.startsWith("(") && entry.name.endsWith(")");
    const childPrefix = isRouteGroup ? urlPrefix : `${urlPrefix}/${entry.name}`;

    routes.push(...discoverStaticRoutes(childDir, childPrefix));
  }

  return routes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = discoverStaticRoutes(APP_DIR).filter(
    (route) => !route.startsWith("/api") && !EXCLUDED_PREFIXES.some((prefix) => route === prefix || route.startsWith(`${prefix}/`))
  );

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  const [rootCategories, products, posts] = await Promise.all([
    prisma.productCategory.findMany({
      where: { parentId: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        slug: true,
        updatedAt: true,
        category: { select: { slug: true, parent: { select: { slug: true } } } },
      },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = rootCategories.map((category) => ({
    url: `${SITE_URL}/products/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) => {
    // Same root-slug rule the product page itself enforces (see
    // src/app/products/[categorySlug]/[productSlug]/page.tsx) — a product
    // with no resolvable root category has no valid URL to list.
    const rootSlug = product.category?.parent?.slug ?? product.category?.slug;
    if (!rootSlug) return [];
    return [
      {
        url: `${SITE_URL}/products/${rootSlug}/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
    ];
  });

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...blogEntries];
}
