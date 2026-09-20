import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ProductSpec } from "@/lib/product-json";
import { BASE_SPEC_UNITS, uniqueStrings } from "@/lib/spec-options";
import {
  SITE_CONTENT_TAG,
  SPEC_SUGGESTIONS_KEY,
  SPEC_TEMPLATES_KEY,
  parseSpecSuggestions,
  parseSpecTemplates,
} from "@/lib/site-content";

const MAX_SUGGESTIONS = 200;

/**
 * Adds any unit/label a just-saved product used that isn't already a
 * suggestion (built-in units, template labels, or an earlier addition), so it
 * shows up in the form's dropdown next time. Reads the rows fresh from the DB
 * (not the 5-minute cached site-content map) so two quick saves can't both
 * decide the same value is "new".
 */
export async function rememberSpecSuggestions(specs: ProductSpec[]) {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: [SPEC_TEMPLATES_KEY, SPEC_SUGGESTIONS_KEY] } } });
  const raw = (key: string) => rows.find((r) => r.key === key)?.value;
  const custom = parseSpecSuggestions(raw(SPEC_SUGGESTIONS_KEY));
  const templates = parseSpecTemplates(raw(SPEC_TEMPLATES_KEY));

  const knownUnits = new Set(uniqueStrings(BASE_SPEC_UNITS, custom.units));
  const knownLabels = new Set(uniqueStrings(...Object.values(templates), custom.labels));

  const newUnits = uniqueStrings(specs.map((s) => s.unit ?? "").filter((u) => u && !knownUnits.has(u)));
  const newLabels = uniqueStrings(specs.map((s) => s.label).filter((l) => l && !knownLabels.has(l)));
  if (newUnits.length === 0 && newLabels.length === 0) return;

  const value = JSON.stringify({
    units: [...custom.units, ...newUnits].slice(0, MAX_SUGGESTIONS),
    labels: [...custom.labels, ...newLabels].slice(0, MAX_SUGGESTIONS),
  });
  await prisma.siteContent.upsert({
    where: { key: SPEC_SUGGESTIONS_KEY },
    update: { value },
    create: { key: SPEC_SUGGESTIONS_KEY, value },
  });
  revalidateTag(SITE_CONTENT_TAG);
}
