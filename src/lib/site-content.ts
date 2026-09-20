import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";
import { linkifyKnownPhrases } from "@/lib/site-section-links";
import { SPEC_TEMPLATES, type SpecTemplateKey, type SpecTemplates } from "@/lib/product-spec-templates";
import type { SpecSuggestions } from "@/lib/spec-options";
import {
  DEFAULT_HERO_SLIDES,
  DEFAULT_HERO_SETTINGS,
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
  DEFAULT_SITE_LOGO,
  type SiteLogoContent,
  type HeroSlideContent,
  type HeroSettingsContent,
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

export { DEFAULT_HERO_SLIDES, DEFAULT_HERO_SETTINGS, DEFAULT_FOOTER_CONTACT, DEFAULT_FAQ_ITEMS };
export type {
  SiteLogoContent,
  HeroSlideContent,
  HeroSettingsContent,
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
export const HERO_SETTINGS_KEY = "hero.settings";
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
export const SITE_LOGO_KEY = "site.logo";
export const SPEC_TEMPLATES_KEY = "spec.templates";
export const SPEC_SUGGESTIONS_KEY = "spec.suggestions";

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

export async function getSiteLogo(): Promise<SiteLogoContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<SiteLogoContent>(map[SITE_LOGO_KEY], DEFAULT_SITE_LOGO);
}

export async function getHeroSettings(): Promise<HeroSettingsContent> {
  const map = await getSiteContentMap();
  return parseJsonObject<HeroSettingsContent>(map[HERO_SETTINGS_KEY], DEFAULT_HERO_SETTINGS);
}

export async function getFooterContact(): Promise<FooterContactContent> {
  const map = await getSiteContentMap();
  const saved = parseJsonObject<FooterContactContent & { instagramUrl?: string; linkedinUrl?: string; telegramUrl?: string }>(
    map[FOOTER_CONTACT_KEY],
    DEFAULT_FOOTER_CONTACT,
  );
  // Rows saved before social links became a free-form list carry three fixed
  // fields instead — fold them into the list so nothing an admin already
  // entered disappears (the next save rewrites the row without them).
  const { instagramUrl, linkedinUrl, telegramUrl, ...rest } = saved;
  const legacy = [instagramUrl, linkedinUrl, telegramUrl].filter((u): u is string => !!u);
  return { ...rest, socialLinks: Array.isArray(saved.socialLinks) && saved.socialLinks.length > 0 ? saved.socialLinks : legacy };
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

const MAX_SPEC_LABEL_LENGTH = 120;
const MAX_TEMPLATE_ROWS = 60;

function cleanStringList(input: unknown, maxLength: number, maxItems: number): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const value = raw.trim().slice(0, maxLength);
    if (value && !out.includes(value)) out.push(value);
    if (out.length >= maxItems) break;
  }
  return out;
}

/** Saved per-template label lists layered over the shipped SPEC_TEMPLATES defaults — a key missing from the saved row keeps its default. */
export function parseSpecTemplates(raw: string | undefined): SpecTemplates {
  let saved: Record<string, unknown> = {};
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") saved = parsed;
  } catch {
    // fall through to defaults
  }
  const out = { ...SPEC_TEMPLATES } as SpecTemplates;
  for (const key of Object.keys(SPEC_TEMPLATES) as SpecTemplateKey[]) {
    if (Array.isArray(saved[key])) out[key] = cleanStringList(saved[key], MAX_SPEC_LABEL_LENGTH, MAX_TEMPLATE_ROWS);
  }
  return out;
}

export function cleanSpecTemplates(input: unknown): SpecTemplates {
  const obj = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out = {} as SpecTemplates;
  for (const key of Object.keys(SPEC_TEMPLATES) as SpecTemplateKey[]) {
    out[key] = cleanStringList(obj[key], MAX_SPEC_LABEL_LENGTH, MAX_TEMPLATE_ROWS);
  }
  return out;
}

/** Only the admin-typed additions — the built-in units/labels are merged in by the caller. */
export function parseSpecSuggestions(raw: string | undefined): SpecSuggestions {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    return { units: cleanStringList(parsed?.units, 30, 200), labels: cleanStringList(parsed?.labels, MAX_SPEC_LABEL_LENGTH, 200) };
  } catch {
    return { units: [], labels: [] };
  }
}

export async function getSpecTemplates(): Promise<SpecTemplates> {
  const map = await getSiteContentMap();
  return parseSpecTemplates(map[SPEC_TEMPLATES_KEY]);
}

export async function getSpecSuggestions(): Promise<SpecSuggestions> {
  const map = await getSiteContentMap();
  return parseSpecSuggestions(map[SPEC_SUGGESTIONS_KEY]);
}
