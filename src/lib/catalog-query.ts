import type { Prisma } from "@/generated/prisma/client";
import { param, paramList, type ListSearchParams } from "@/lib/list-query";

export const CATALOG_PAGE_SIZE = 24;
export const CATALOG_SORTS = ["newest", "price-asc", "price-desc", "name"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export type CatalogQueryInput = {
  searchParams: ListSearchParams;
  categoryId?: string;
  childCategoryIds: string[];
  validSubSlugs: Map<string, string>;
  validBrandSlugs: Map<string, string>;
};

export type CatalogQuery = {
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput;
  page: number;
  skip: number;
  take: number;
  sort: CatalogSort;
  activePriceRange: { min?: number; max?: number } | null;
};

function parseIntParam(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function resolveOrderBy(sort: CatalogSort): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "name": return { name: "asc" };
    case "price-asc": return { price: { sort: "asc", nulls: "last" } };
    case "price-desc": return { price: { sort: "desc", nulls: "last" } };
    case "newest":
    default: return { createdAt: "desc" };
  }
}

export function buildCatalogQuery(input: CatalogQueryInput): CatalogQuery {
  const { searchParams, categoryId, childCategoryIds, validSubSlugs, validBrandSlugs } = input;

  const where: Prisma.ProductWhereInput = { isActive: true, deletedAt: null };

  // Category / subcategory scope.
  const subIds = paramList(searchParams, "sub")
    .map((s) => validSubSlugs.get(s))
    .filter((v): v is string => Boolean(v));
  if (subIds.length > 0) {
    where.categoryId = { in: subIds };
  } else if (categoryId) {
    where.categoryId = { in: [categoryId, ...childCategoryIds] };
  }

  // Brand.
  const brandIds = paramList(searchParams, "brand")
    .map((s) => validBrandSlugs.get(s))
    .filter((v): v is string => Boolean(v));
  if (brandIds.length > 0) where.brandId = { in: brandIds };

  // Availability.
  if (param(searchParams, "stock") === "1") where.availability = "IN_STOCK";

  // Price.
  const min = parseIntParam(param(searchParams, "priceMin"));
  const max = parseIntParam(param(searchParams, "priceMax"));
  let activePriceRange: CatalogQuery["activePriceRange"] = null;
  if (min !== undefined || max !== undefined) {
    where.showPrice = true;
    where.price = {};
    if (min !== undefined) where.price.gte = min;
    if (max !== undefined) where.price.lte = max;
    activePriceRange = { min, max };
  }

  // Sort.
  const rawSort = param(searchParams, "sort");
  const sort: CatalogSort = (CATALOG_SORTS as readonly string[]).includes(rawSort ?? "")
    ? (rawSort as CatalogSort)
    : "newest";

  // Page.
  const rawPage = Number(param(searchParams, "page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  return {
    where,
    orderBy: resolveOrderBy(sort),
    page,
    skip: (page - 1) * CATALOG_PAGE_SIZE,
    take: CATALOG_PAGE_SIZE,
    sort,
    activePriceRange,
  };
}
