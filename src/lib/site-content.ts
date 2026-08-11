import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";
import {
  DEFAULT_HERO_SLIDES,
  DEFAULT_PRODUCT_CATEGORIES,
  type HeroSlideContent,
  type ProductCategoryContent,
} from "@/lib/site-content-defaults";

export { DEFAULT_HERO_SLIDES, DEFAULT_PRODUCT_CATEGORIES };
export type { HeroSlideContent, ProductCategoryContent };

export const SITE_CONTENT_TAG = "site-content";

const HERO_SLIDES_KEY = "hero.slides";
const PRODUCT_CATEGORIES_KEY = "products.categories";

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

function parseJsonArray<T>(raw: string | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export async function getHeroSlides(): Promise<HeroSlideContent[]> {
  const map = await getSiteContentMap();
  const slides = parseJsonArray<HeroSlideContent>(map[HERO_SLIDES_KEY], DEFAULT_HERO_SLIDES);
  return slides.map((slide) => ({ ...slide, description: sanitizeRichText(slide.description) }));
}

export async function getProductCategories(): Promise<ProductCategoryContent[]> {
  const map = await getSiteContentMap();
  const categories = parseJsonArray<ProductCategoryContent>(map[PRODUCT_CATEGORIES_KEY], DEFAULT_PRODUCT_CATEGORIES);
  return categories.map((category) => ({ ...category, description: sanitizeRichText(category.description) }));
}
