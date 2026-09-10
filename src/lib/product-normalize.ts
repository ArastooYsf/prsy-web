import { prisma } from "@/lib/prisma";
import { PRODUCT_AVAILABILITIES } from "@/lib/status-labels";

export async function resolveCategoryId(input: unknown): Promise<string | null> {
  if (typeof input !== "string" || !input) return null;
  const found = await prisma.productCategory.findUnique({ where: { id: input } });
  return found ? found.id : null;
}

export async function resolveBrandId(input: unknown): Promise<string | null> {
  if (typeof input !== "string" || !input) return null;
  const found = await prisma.brand.findUnique({ where: { id: input } });
  return found ? found.id : null;
}

export function normalizeAvailability(input: unknown): "IN_STOCK" | "OUT_OF_STOCK" | "CALL" {
  return typeof input === "string" && PRODUCT_AVAILABILITIES.includes(input)
    ? (input as "IN_STOCK" | "OUT_OF_STOCK" | "CALL")
    : "IN_STOCK";
}

export function normalizePrice(input: unknown, showPrice: boolean): number | null {
  if (!showPrice) return null;
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}
