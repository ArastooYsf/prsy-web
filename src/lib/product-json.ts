import { sanitizePlainText } from "@/lib/sanitize";

export type ProductSpec = { label: string; value: string };

const MAX_IMAGES = 12;
const MAX_SPECS = 40;

export function parseProductImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const path = raw.trim();
    if (!path || out.includes(path)) continue;
    out.push(path);
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
}

export function parseProductSpecs(input: unknown): ProductSpec[] {
  if (!Array.isArray(input)) return [];
  const out: ProductSpec[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const label = sanitizePlainText(String((raw as Record<string, unknown>).label ?? "")).trim().slice(0, 120);
    const value = sanitizePlainText(String((raw as Record<string, unknown>).value ?? "")).trim().slice(0, 500);
    if (!label || !value) continue;
    out.push({ label, value });
    if (out.length >= MAX_SPECS) break;
  }
  return out;
}
