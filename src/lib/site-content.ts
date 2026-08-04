import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const SITE_CONTENT_TAG = "site-content";

async function loadSiteContentMap(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteContent.findMany();
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch {
    // DB not configured/reachable yet — callers fall back to hardcoded defaults.
    return {};
  }
}

/**
 * Cached read of the whole site_content table. Revalidated on-demand via
 * revalidateTag(SITE_CONTENT_TAG) whenever the admin panel saves content,
 * plus a 5-minute time-based fallback.
 */
export const getSiteContentMap = unstable_cache(loadSiteContentMap, ["site-content-map"], {
  tags: [SITE_CONTENT_TAG],
  revalidate: 300,
});

export const HERO_SLIDE_IDS = [
  "diesel-generators",
  "power-engines",
  "spare-parts",
  "overhaul",
] as const;

export const PRODUCT_CATEGORY_IDS = [
  "diesel-generators",
  "power-engines",
  "spare-parts",
  "generator-engines",
  "alternators",
  "overhaul",
] as const;

export type HeroOverride = {
  title?: string;
  description?: string;
  image?: string;
};

export async function getHeroOverrides(): Promise<Record<string, HeroOverride>> {
  const map = await getSiteContentMap();
  const overrides: Record<string, HeroOverride> = {};

  for (const id of HERO_SLIDE_IDS) {
    overrides[id] = {
      title: map[`hero.${id}.title`],
      description: map[`hero.${id}.description`],
      image: map[`hero.${id}.image`],
    };
  }

  return overrides;
}

export async function getAboutContent(): Promise<{ title?: string; body?: string }> {
  const map = await getSiteContentMap();
  return {
    title: map["about.title"],
    body: map["about.body"],
  };
}

export async function getProductCategoryImages(): Promise<Record<string, string | undefined>> {
  const map = await getSiteContentMap();
  const images: Record<string, string | undefined> = {};

  for (const id of PRODUCT_CATEGORY_IDS) {
    images[id] = map[`products.${id}.image`];
  }

  return images;
}
