import { cookies } from "next/headers";
import { Boxes } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildCatalogQuery, CATALOG_PAGE_SIZE } from "@/lib/catalog-query";
import { paramList, type ListSearchParams } from "@/lib/list-query";
import { formatNumber } from "@/lib/format-number";
import { PRODUCT_VIEW_MODE_COOKIE, resolveProductViewMode } from "@/lib/product-view-mode";
import { getProductFiltersContent } from "@/lib/site-content";
import { parseProductSpecs, formatSpecValue } from "@/lib/product-json";
import { slugify } from "@/lib/slugify";
import EmptyState from "@/components/ui/EmptyState";
import Breadcrumb, { type Crumb } from "@/components/products/Breadcrumb";
import ProductGrid, { CATALOG_GRID_CLASS } from "@/components/products/ProductGrid";
import ViewModeToggle from "@/components/products/ViewModeToggle";
import CatalogPagination from "@/components/products/CatalogPagination";
import CatalogSortSelect from "@/components/products/CatalogSortSelect";
import CatalogFilterPanel, { type FacetOption, type SpecFacet } from "@/components/products/CatalogFilterPanel";
import CatalogQuickFilters from "@/components/products/CatalogQuickFilters";
import { catalogProductInclude, type CatalogProduct } from "@/components/products/ProductCard";
import type { Prisma } from "@/generated/prisma/client";

type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
  filterSpecKeys?: string[];
};

export type CatalogViewProps = {
  category?: CatalogCategory;
  basePath: string;
  searchParams: ListSearchParams;
};

export default async function CatalogView({ category, basePath, searchParams }: CatalogViewProps) {
  // --- facet inputs ---
  // Subcategory facet: the category's children (each maps to itself only), or
  // (unscoped) all top-level categories (each maps to itself + its children —
  // products live on leaf categories, never directly on a root).
  const subFacetRows: { id: string; name: string; slug: string; descendantIds: string[] }[] = category
    ? category.children.map((c) => ({ ...c, descendantIds: [c.id] }))
    : (
        await prisma.productCategory.findMany({
          where: { parentId: null },
          orderBy: [{ order: "asc" }, { name: "asc" }],
          select: { id: true, name: true, slug: true, children: { select: { id: true } } },
        })
      ).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        descendantIds: [r.id, ...r.children.map((c) => c.id)],
      }));

  const childIds = category ? category.children.map((c) => c.id) : [];
  const validSubSlugs = new Map<string, string[]>(subFacetRows.map((r) => [r.slug, r.descendantIds]));

  // Category scope used for deriving the brand + price facets (ignores brand/price filters).
  const scopeWhere: Prisma.ProductWhereInput = { isActive: true, deletedAt: null };
  const scopedSubIds = paramList(searchParams, "sub").flatMap((s) => validSubSlugs.get(s) ?? []);
  if (scopedSubIds.length > 0) scopeWhere.categoryId = { in: scopedSubIds };
  else if (category) scopeWhere.categoryId = { in: [category.id, ...childIds] };

  // Facet inputs are all independent of each other — fetched concurrently.
  const filterSpecLabels = category?.filterSpecKeys ?? [];
  const [brandRows, priceAgg, productFiltersContent, specRows] = await Promise.all([
    // Brand facet: brands appearing on in-scope products.
    prisma.product.findMany({
      where: { ...scopeWhere, brandId: { not: null } },
      select: { brand: { select: { id: true, name: true, slug: true } } },
      distinct: ["brandId"],
    }),
    // Price facet bounds: min/max price among in-scope priced products.
    prisma.product.aggregate({
      where: { ...scopeWhere, showPrice: true, price: { not: null } },
      _min: { price: true },
      _max: { price: true },
    }),
    getProductFiltersContent(),
    filterSpecLabels.length > 0
      ? prisma.product.findMany({ where: scopeWhere, select: { specs: true } })
      : Promise.resolve([]),
  ]);

  const brands = brandRows
    .map((r) => r.brand)
    .filter((b): b is { id: string; name: string; slug: string } => Boolean(b));
  const brandOptions: FacetOption[] = brands
    .map((b) => ({ label: b.name, slug: b.slug }))
    .sort((a, b) => a.label.localeCompare(b.label, "fa"));
  // buildCatalogQuery needs a slug->id map for its `validBrandSlugs` arg.
  const brandIdBySlug = new Map<string, string>(brands.map((b) => [b.slug, b.id]));

  const priceBounds =
    priceAgg._min.price != null && priceAgg._max.price != null && priceAgg._max.price > priceAgg._min.price
      ? { min: priceAgg._min.price, max: priceAgg._max.price }
      : null;

  // --- spec-based facets (admin-configured per category, see filterSpecKeys) ---
  let specFacets: SpecFacet[] = [];
  if (filterSpecLabels.length > 0) {
    const valuesByLabel = new Map<string, Map<string, string>>(); // label -> (valueSlug -> display)
    for (const row of specRows) {
      for (const spec of parseProductSpecs(row.specs)) {
        if (!filterSpecLabels.includes(spec.label)) continue;
        const display = formatSpecValue(spec);
        const valueSlug = slugify(display) || slugify(spec.value);
        if (!valueSlug) continue;
        if (!valuesByLabel.has(spec.label)) valuesByLabel.set(spec.label, new Map());
        valuesByLabel.get(spec.label)!.set(valueSlug, display);
      }
    }
    specFacets = filterSpecLabels
      .map((label) => {
        const values = valuesByLabel.get(label);
        if (!values || values.size === 0) return null;
        const options: FacetOption[] = [...values.entries()]
          .map(([slug, display]) => ({ label: display, slug }))
          .sort((a, b) => a.label.localeCompare(b.label, "fa"));
        return { label, labelSlug: slugify(label), options };
      })
      .filter((f): f is SpecFacet => f !== null);
  }

  // Active spec filters from the URL, scoped to this category's facets.
  const activeSpecFilters = new Map<string, string[]>();
  for (const facet of specFacets) {
    const values = paramList(searchParams, `spec_${facet.labelSlug}`);
    if (values.length > 0) activeSpecFilters.set(facet.label, values);
  }

  // --- the actual product query ---
  const q = buildCatalogQuery({
    searchParams,
    categoryId: category?.id,
    childCategoryIds: childIds,
    validSubSlugs,
    validBrandSlugs: brandIdBySlug,
  });

  let products: CatalogProduct[];
  let count: number;
  if (activeSpecFilters.size > 0) {
    // Spec values live in a free-form JSON array per product, so "any element
    // has label X and value in [...]" isn't a single Prisma/MySQL predicate
    // without raw JSON_TABLE SQL — fetch everything else that matches, filter
    // by specs in JS, then paginate in JS.
    // ponytail: fine at this catalog's scale (a B2B equipment catalog, not a
    // mass retailer); if it ever grows into the thousands of products, move
    // this to a raw JSON_TABLE query instead of loading the full match set.
    const allMatching = await prisma.product.findMany({
      where: q.where,
      orderBy: q.orderBy,
      include: catalogProductInclude,
    });
    const filtered = allMatching.filter((p) => {
      const specs = parseProductSpecs(p.specs);
      for (const [label, wantedSlugs] of activeSpecFilters) {
        const hit = specs.some((s) => {
          if (s.label !== label) return false;
          const slug = slugify(formatSpecValue(s)) || slugify(s.value);
          return wantedSlugs.includes(slug);
        });
        if (!hit) return false;
      }
      return true;
    });
    count = filtered.length;
    products = filtered.slice(q.skip, q.skip + q.take);
  } else {
    [products, count] = await Promise.all([
      prisma.product.findMany({
        where: q.where,
        orderBy: q.orderBy,
        skip: q.skip,
        take: q.take,
        include: catalogProductInclude,
      }),
      prisma.product.count({ where: q.where }),
    ]);
  }

  const pageCount = Math.ceil(count / CATALOG_PAGE_SIZE);
  const mode = resolveProductViewMode(cookies().get(PRODUCT_VIEW_MODE_COOKIE)?.value);

  // --- breadcrumb ---
  const crumbs: Crumb[] = [{ label: "همه‌ی محصولات", href: "/products/all" }];
  if (category) crumbs.push({ label: category.name, href: `/products/${category.slug}` });
  const subSlugs = paramList(searchParams, "sub");
  const soleSub = subSlugs.length === 1 ? subSlugs[0] : null;
  if (soleSub) {
    const s = subFacetRows.find((r) => r.slug === soleSub);
    if (s) crumbs.push({ label: s.name });
  }

  // --- pagination href builder (preserve all params, swap page) ---
  const makeHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === "page") continue;
      const val = Array.isArray(v) ? v[0] : v;
      if (val) params.set(k, val);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <section className="container py-8">
      <Breadcrumb items={crumbs} />

      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
        {q.searchQuery ? `نتایج جست‌وجو برای «${q.searchQuery}»` : category ? category.name : "همه‌ی محصولات"}
      </h1>

      <CatalogQuickFilters basePath={basePath} brandOptions={brandOptions} />

      <div className="mt-6 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CatalogFilterPanel
            basePath={basePath}
            subLabel={category ? "زیردسته‌ها" : "دسته‌بندی"}
            subOptions={subFacetRows.map((r) => ({ label: r.name, slug: r.slug }))}
            brandOptions={brandOptions}
            priceBounds={priceBounds}
            builtinFilters={productFiltersContent}
            specFacets={specFacets}
          />
        </aside>

        <div className="mt-6 min-w-0 lg:mt-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground/60">{formatNumber(count)} محصول</p>
            <div className="flex flex-wrap items-center gap-3">
              <ViewModeToggle mode={mode} />
              <CatalogSortSelect basePath={basePath} />
            </div>
          </div>

          {count === 0 ? (
            <EmptyState
              icon={<Boxes />}
              title="محصولی با این فیلترها یافت نشد."
              description="فیلترها را تغییر دهید یا پاک کنید."
            />
          ) : (
            <>
              <ProductGrid products={products} variant={mode} className={CATALOG_GRID_CLASS[mode]} />
              <CatalogPagination page={q.page} pageCount={pageCount} makeHref={makeHref} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
