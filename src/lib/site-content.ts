import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";
import { linkifyKnownPhrases } from "@/lib/site-section-links";
import {
  DEFAULT_HERO_SLIDES,
  DEFAULT_FOOTER_CONTACT,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_TERMS_HTML,
  DEFAULT_PRIVACY_HTML,
  DEFAULT_WARRANTY_HTML,
  DEFAULT_CONTACT_INTRO_HTML,
  type HeroSlideContent,
  type FooterContactContent,
  type FaqItemContent,
} from "@/lib/site-content-defaults";

export { DEFAULT_HERO_SLIDES, DEFAULT_FOOTER_CONTACT, DEFAULT_FAQ_ITEMS };
export type { HeroSlideContent, FooterContactContent, FaqItemContent };

export const SITE_CONTENT_TAG = "site-content";

const HERO_SLIDES_KEY = "hero.slides";
export const FOOTER_CONTACT_KEY = "footer.contact";
export const FAQ_ITEMS_KEY = "faq.items";

// One rich-text blob per admin-editable legal/info page — same simple
// key/value SiteContent row the hero slides and footer contact already use,
// just a plain HTML string instead of JSON.
export const LEGAL_PAGE_KEYS = {
  terms: "page.terms",
  privacy: "page.privacy",
  warranty: "page.warranty",
  "contact-intro": "page.contact-intro",
} as const;
export type LegalPageKey = keyof typeof LEGAL_PAGE_KEYS;

const LEGAL_PAGE_DEFAULTS: Record<LegalPageKey, string> = {
  terms: DEFAULT_TERMS_HTML,
  privacy: DEFAULT_PRIVACY_HTML,
  warranty: DEFAULT_WARRANTY_HTML,
  "contact-intro": DEFAULT_CONTACT_INTRO_HTML,
};

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
  return slides.map((slide) => ({ ...slide, description: linkifyKnownPhrases(sanitizeRichText(slide.description)) }));
}

function parseJsonObject<T extends object>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

export async function getFooterContact(): Promise<FooterContactContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<FooterContactContent>(map[FOOTER_CONTACT_KEY], DEFAULT_FOOTER_CONTACT);
}

export async function getFaqItems(): Promise<FaqItemContent[]> {
  const map = await getSiteContentMap();
  return parseJsonArray<FaqItemContent>(map[FAQ_ITEMS_KEY], DEFAULT_FAQ_ITEMS);
}

/** Sanitized + auto-linked HTML for one of the admin-editable legal/info pages (terms, privacy, warranty, contact intro). */
export async function getLegalPageHtml(page: LegalPageKey): Promise<string> {
  const map = await getSiteContentMap();
  const raw = map[LEGAL_PAGE_KEYS[page]] ?? LEGAL_PAGE_DEFAULTS[page];
  return linkifyKnownPhrases(sanitizeRichText(raw));
}
