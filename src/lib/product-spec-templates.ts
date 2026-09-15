// Pre-filled "مشخصات فنی" (technical specs) field sets shown in the admin
// product form. A new set only needs an entry here plus setting that key as
// a root ProductCategory's `specTemplateKey` (see prisma/seed-catalog.ts) —
// no other code changes.
export const SPEC_TEMPLATES = {
  generator: [
    "توان پرایم (کاوا)",
    "توان اضطراری (کاوا)",
    "توان پرایم",
    "توان اضطراری",
    "برند موتور",
    "مدل موتور",
    "کشور سازنده موتور",
    "قدرت موتور",
    "حداکثر قدرت موتور",
    "توان موتور",
    "حداکثر توان موتور",
    "حجم موتور",
    "تعداد سیلندر",
    "سیستم تنفس",
    "نوع گاورنر",
    "مصرف سوخت ۱۰۰٪",
    "برند آلترناتور",
    "کشور سازنده آلترناتور",
    "مدل آلترناتور",
    "توان اسمی آلترناتور",
    "توان اضطراری آلترناتور",
    "فرکانس",
    "عایق",
    "سیستم حفاظت",
    "بهره‌وری",
    "ضریب قدرت",
    "تعداد بلبرینگ",
    "ولتاژ خروجی",
  ],
  "spare-parts": ["شماره فنی (Part Number)", "برند سازنده", "مدل/دستگاه سازگار", "جنس", "وزن (کیلوگرم)"],
} as const satisfies Record<string, readonly string[]>;

export type SpecTemplateKey = keyof typeof SPEC_TEMPLATES;

const DEFAULT_SPEC_TEMPLATE: SpecTemplateKey = "generator";

function isSpecTemplateKey(value: string | null | undefined): value is SpecTemplateKey {
  return !!value && value in SPEC_TEMPLATES;
}

/** The template key that actually applies for a given root category's own `specTemplateKey` value. */
export function resolvedSpecTemplateKey(specTemplateKey: string | null | undefined): SpecTemplateKey {
  return isSpecTemplateKey(specTemplateKey) ? specTemplateKey : DEFAULT_SPEC_TEMPLATE;
}

export type CategoryForTemplate = { id: string; parentId: string | null; specTemplateKey: string | null };

// Categories are enforced (server-side, see the categories API routes) to be
// at most two levels deep — a root and its direct children — so resolving
// "the root" is a single parent hop, not a general tree walk.
function findRootCategory<T extends CategoryForTemplate>(categoryId: string, categories: T[]): T | undefined {
  const current = categories.find((c) => c.id === categoryId);
  if (!current) return undefined;
  return current.parentId ? categories.find((c) => c.id === current.parentId) : current;
}

/** The ordered list of spec labels to pre-fill for a given category (or the general-default set when categoryId is empty/unmatched). */
export function resolveSpecTemplate(categoryId: string | null | undefined, categories: CategoryForTemplate[]): readonly string[] {
  const root = categoryId ? findRootCategory(categoryId, categories) : undefined;
  return SPEC_TEMPLATES[resolvedSpecTemplateKey(root?.specTemplateKey)];
}

// Only labels that are actually part of the category's own spec template can
// be picked as quick-preview fields — same trust boundary as specTemplateKey.
// Shared by both categories API routes (create and update) so the allow-list
// rule only has one place to change.
export function normalizePreviewSpecKeys(input: unknown, specTemplateKey: string | null): string[] | null {
  if (!Array.isArray(input)) return null;
  const allowed = new Set<string>(SPEC_TEMPLATES[resolvedSpecTemplateKey(specTemplateKey)]);
  const out = [...new Set(input.filter((v): v is string => typeof v === "string" && allowed.has(v)))];
  return out.length > 0 ? out : null;
}
