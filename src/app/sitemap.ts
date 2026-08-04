import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://yasharindustry.com";
const APP_DIR = path.join(process.cwd(), "src", "app");
const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/;

/**
 * Walks src/app and collects every route that has a page file, so newly
 * added pages show up here automatically with no edits to this file.
 * Route groups "(name)" are unwrapped; dynamic segments "[slug]" are
 * skipped since they need real param values to produce a URL.
 */
function discoverRoutes(dir: string, urlPrefix = ""): string[] {
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

    routes.push(...discoverRoutes(childDir, childPrefix));
  }

  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = discoverRoutes(APP_DIR).filter((route) => !route.startsWith("/api"));

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
