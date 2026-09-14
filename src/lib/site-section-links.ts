// Well-known site sections, auto-linked wherever their name is mentioned
// inside admin-edited rich text (product descriptions, blog posts, hero
// slides, ...) — see `linkifyKnownPhrases` below. Longer, more specific
// phrases are listed first so e.g. "درخواست مشاوره" wins over a shorter
// phrase that might otherwise match inside it.
export const SITE_SECTION_LINKS: readonly { phrase: string; href: string }[] = [
  { phrase: "درخواست مشاوره", href: "/consultation" },
  { phrase: "فرم مشاوره", href: "/consultation" },
  { phrase: "مشاوره رایگان", href: "/consultation" },
  { phrase: "تماس با ما", href: "/contact" },
  { phrase: "سوالات متداول", href: "/faq" },
  { phrase: "درباره ما", href: "/about" },
  { phrase: "قوانین و مقررات", href: "/terms" },
  { phrase: "حریم خصوصی", href: "/privacy" },
  { phrase: "گارانتی و پشتیبانی", href: "/warranty" },
  { phrase: "همه‌ی محصولات", href: "/products/all" },
  { phrase: "وبلاگ", href: "/blog" },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Matches one dictionary phrase at a time, longest-first so a shorter phrase
// never steals a match that belongs to a longer one containing it.
const PHRASE_PATTERN = new RegExp(
  [...SITE_SECTION_LINKS].sort((a, b) => b.phrase.length - a.phrase.length).map((entry) => escapeRegExp(entry.phrase)).join("|"),
  "g",
);
const HREF_BY_PHRASE = new Map(SITE_SECTION_LINKS.map((entry) => [entry.phrase, entry.href]));

// Splits on tag boundaries so replacement only ever touches actual text
// content — attribute values and tag names live entirely inside the `<...>`
// tokens this never looks inside. Safe to run on any HTML, but meant for
// already-sanitized content (see sanitizeRichText) since the hrefs it
// inserts are trusted but the surrounding markup isn't re-validated here.
const TAG_SPLIT = /(<[^>]*>)/g;

/**
 * Wraps the first mention of each known site-section phrase (see
 * SITE_SECTION_LINKS) in an `<a>` to that section — once per phrase per call,
 * not once per occurrence, so a phrase repeated through a long block of text
 * doesn't turn into a wall of identical links. Text already inside an
 * existing `<a>...</a>` is left alone (no nested/duplicate links).
 */
export function linkifyKnownPhrases(html: string): string {
  if (!html) return html;

  const usedPhrases = new Set<string>();
  let anchorDepth = 0;

  return html
    .split(TAG_SPLIT)
    .map((token) => {
      if (token.startsWith("<")) {
        if (/^<a[\s>]/i.test(token)) anchorDepth++;
        else if (/^<\/a\s*>/i.test(token)) anchorDepth = Math.max(0, anchorDepth - 1);
        return token;
      }
      if (anchorDepth > 0 || !token) return token;
      return token.replace(PHRASE_PATTERN, (match) => {
        if (usedPhrases.has(match)) return match;
        usedPhrases.add(match);
        return `<a href="${HREF_BY_PHRASE.get(match)}">${match}</a>`;
      });
    })
    .join("");
}
