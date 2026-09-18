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
  DEFAULT_WHYUS,
  DEFAULT_CUSTOMERS,
  DEFAULT_FEATURES,
  DEFAULT_SOCIALPROOF,
  DEFAULT_CONSULTATION,
  DEFAULT_ABOUT,
  DEFAULT_CONTACT_HERO,
  DEFAULT_LEGAL_HEADINGS,
  DEFAULT_FOOTER_CONTENT,
  DEFAULT_HEADER_NAV_LABELS,
  type HeroSlideContent,
  type FooterContactContent,
  type FaqItemContent,
  type WhyUsContent,
  type CustomersContent,
  type FeaturesContent,
  type SocialProofContent,
  type ConsultationContent,
  type AboutContent,
  type ContactHeroContent,
  type LegalPageHeadingContent,
  type FooterEditableContent,
  type FooterLinkContent,
  type HeaderNavLabelsContent,
} from "@/lib/site-content-defaults";

export { DEFAULT_HERO_SLIDES, DEFAULT_FOOTER_CONTACT, DEFAULT_FAQ_ITEMS };
export type {
  HeroSlideContent,
  FooterContactContent,
  FaqItemContent,
  WhyUsContent,
  CustomersContent,
  FeaturesContent,
  SocialProofContent,
  ConsultationContent,
  AboutContent,
  ContactHeroContent,
  LegalPageHeadingContent,
  FooterEditableContent,
  HeaderNavLabelsContent,
};

export const SITE_CONTENT_TAG = "site-content";

const HERO_SLIDES_KEY = "hero.slides";
export const FOOTER_CONTACT_KEY = "footer.contact";
export const FAQ_ITEMS_KEY = "faq.items";
export const WHYUS_KEY = "whyus.content";
export const CUSTOMERS_KEY = "customers.content";
export const FEATURES_KEY = "features.content";
export const SOCIALPROOF_KEY = "socialproof.content";
export const CONSULTATION_KEY = "consultation.content";
export const ABOUT_KEY = "about.content";
export const CONTACT_HERO_KEY = "contact.hero";
export const FOOTER_CONTENT_KEY = "footer.content";
export const HEADER_NAV_LABELS_KEY = "header.navLabels";

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
  const items = parseJsonArray<FaqItemContent>(map[FAQ_ITEMS_KEY], DEFAULT_FAQ_ITEMS);
  // Answer is rendered via dangerouslySetInnerHTML (rich text, same as blog
  // posts) — sanitize on read too, not just on write, so a legacy plain-text
  // answer saved before this became rich text can't have a stray `<`/`&`
  // misread as markup.
  return items.map((item) => ({ ...item, answer: sanitizeRichText(item.answer) }));
}

/** Sanitized + auto-linked HTML for one of the admin-editable legal/info pages (terms, privacy, warranty, contact intro). */
export async function getLegalPageHtml(page: LegalPageKey): Promise<string> {
  const map = await getSiteContentMap();
  const raw = map[LEGAL_PAGE_KEYS[page]] ?? LEGAL_PAGE_DEFAULTS[page];
  return linkifyKnownPhrases(sanitizeRichText(raw));
}

export async function getWhyUsContent(): Promise<WhyUsContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<WhyUsContent>(map[WHYUS_KEY], DEFAULT_WHYUS);
}

export async function getCustomersContent(): Promise<CustomersContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<CustomersContent>(map[CUSTOMERS_KEY], DEFAULT_CUSTOMERS);
}

export async function getFeaturesContent(): Promise<FeaturesContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<FeaturesContent>(map[FEATURES_KEY], DEFAULT_FEATURES);
}

export async function getSocialProofContent(): Promise<SocialProofContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<SocialProofContent>(map[SOCIALPROOF_KEY], DEFAULT_SOCIALPROOF);
}

export async function getConsultationContent(): Promise<ConsultationContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<ConsultationContent>(map[CONSULTATION_KEY], DEFAULT_CONSULTATION);
}

export async function getAboutContent(): Promise<AboutContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<AboutContent>(map[ABOUT_KEY], DEFAULT_ABOUT);
}

export async function getContactHeroContent(): Promise<ContactHeroContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<ContactHeroContent>(map[CONTACT_HERO_KEY], DEFAULT_CONTACT_HERO);
}

export async function getFooterEditableContent(): Promise<FooterEditableContent> {
  const map = await getSiteContentMap();
  const saved = parseJsonObject<FooterEditableContent>(map[FOOTER_CONTENT_KEY], DEFAULT_FOOTER_CONTENT);
  // Merge by id, not a blind array overwrite: an old saved row (from before a
  // link was added/removed in code) must not silently drop or misalign a
  // link that a newer deploy introduced — fall back to that one link's
  // default label instead of losing the row entirely.
  const mergeLinks = (defaults: FooterLinkContent[], saved: FooterLinkContent[]) =>
    defaults.map((d) => saved.find((s) => s.id === d.id) ?? d);
  return {
    ...saved,
    quickLinks: mergeLinks(DEFAULT_FOOTER_CONTENT.quickLinks, saved.quickLinks),
    services: mergeLinks(DEFAULT_FOOTER_CONTENT.services, saved.services),
  };
}

export async function getHeaderNavLabels(): Promise<HeaderNavLabelsContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<HeaderNavLabelsContent>(map[HEADER_NAV_LABELS_KEY], DEFAULT_HEADER_NAV_LABELS);
}

// Headings for the 3 legal pages that have their own hero section (contact-intro
// doesn't — its "hero" is the /contact page's own, separately editable hero).
const LEGAL_PAGE_HEADING_KEYS: Record<LegalPageWithHeading, string> = {
  terms: "page.terms.heading",
  privacy: "page.privacy.heading",
  warranty: "page.warranty.heading",
};
export type LegalPageWithHeading = "terms" | "privacy" | "warranty";

export async function getLegalPageHeading(page: LegalPageWithHeading): Promise<LegalPageHeadingContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<LegalPageHeadingContent>(map[LEGAL_PAGE_HEADING_KEYS[page]], DEFAULT_LEGAL_HEADINGS[page]);
}

async function getLegalPageLatestUpdatedAt(page: LegalPageWithHeading): Promise<Date | null> {
  try {
    const rows = await prisma.siteContent.findMany({
      where: { key: { in: [LEGAL_PAGE_KEYS[page], LEGAL_PAGE_HEADING_KEYS[page]] } },
      select: { updatedAt: true },
    });
    if (rows.length === 0) return null;
    return rows.reduce((latest, row) => (row.updatedAt > latest ? row.updatedAt : latest), rows[0].updatedAt);
  } catch {
    return null;
  }
}

/** Combined html + heading + the most recent updatedAt across both rows, for the public page's "last updated" line. */
export async function getLegalPageMeta(
  page: LegalPageWithHeading,
): Promise<{ html: string; heading: LegalPageHeadingContent; updatedAt: Date | null }> {
  const [html, heading, updatedAt] = await Promise.all([
    getLegalPageHtml(page),
    getLegalPageHeading(page),
    getLegalPageLatestUpdatedAt(page),
  ]);
  return { html, heading, updatedAt };
}
