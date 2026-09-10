import { Boxes } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildCatalogQuery, CATALOG_PAGE_SIZE } from "@/lib/catalog-query";
import { paramList, type ListSearchParams } from "@/lib/list-query";
import { formatNumber } from "@/lib/format-number";
import EmptyState from "@/components/ui/EmptyState";
import Breadcrumb, { type Crumb } from "@/components/products/Breadcrumb";
import ProductGrid from "@/components/products/ProductGrid";
import CatalogPagination from "@/components/products/CatalogPagination";
import CatalogSortSelect from "@/components/products/CatalogSortSelect";
import CatalogFilterPanel, { type FacetOption } from "@/components/products/CatalogFilterPanel";
import type { CatalogProduct } from "@/components/products/ProductCard";
import type { Prisma } from "@/generated/prisma/client";

type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

export type CatalogViewProps = {
  category?: CatalogCategory;
  basePath: string;
  searchParams: ListSearchParams;
};

export default async function CatalogView({ category, basePath, searchParams }: CatalogViewProps) {
  // --- facet inputs ---
  // Subcategory facet: the category's children, or (unscoped) all top-level categories.
  const subFacetRows = category
    ? category.children
    : await prisma.productCategory.findMany({
        where: { parentId: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true },
      });

  const childIds = category ? category.children.map((c) => c.id) : [];
  const validSubSlugs = new Map<string, string>(subFacetRows.map((r) => [r.slug, r.id]));

  // Category scope used for deriving the brand + price facets (ignores brand/price filters).
  const scopeWhere: Prisma.ProductWhereInput = { isActive: true, deletedAt: null };
  const scopedSubIds = paramList(searchParams, "sub")
    .map((s) => validSubSlugs.get(s))
    .filter((v): v is string => Boolean(v));
  if (scopedSubIds.length > 0) scopeWhere.categoryId = { in: scopedSubIds };
  else if (category) scopeWhere.categoryId = { in: [category.id, ...childIds] };

  // Brand facet: brands appearing on in-scope products.
  const brandRows = await prisma.product.findMany({
    where: { ...scopeWhere, brandId: { not: null } },
    select: { brand: { select: { id: true, name: true, slug: true } } },
    distinct: ["brandId"],
  });
  const brands = brandRows
    .map((r) => r.brand)
    .filter((b): b is { id: string; name: string; slug: string } => Boolean(b));
  const brandOptions: FacetOption[] = brands
    .map((b) => ({ label: b.name, slug: b.slug }))
    .sort((a, b) => a.label.localeCompare(b.label, "fa"));
  // buildCatalogQuery needs a slug->id map for its `validBrandSlugs` arg.
  const brandIdBySlug = new Map<string, string>(brands.map((b) => [b.slug, b.id]));

  // Price facet bounds: min/max price among in-scope priced products.
  const priceAgg = await prisma.product.aggregate({
    where: { ...scopeWhere, showPrice: true, price: { not: null } },
    _min: { price: true },
    _max: { price: true },
  });
  const priceBounds =
    priceAgg._min.price != null && priceAgg._max.price != null && priceAgg._max.price > priceAgg._min.price
      ? { min: priceAgg._min.price, max: priceAgg._max.price }
      : null;

  // --- the actual product query ---
  const q = buildCatalogQuery({
    searchParams,
    categoryId: category?.id,
    childCategoryIds: childIds,
    validSubSlugs,
    validBrandSlugs: brandIdBySlug,
  });

  const [products, count] = await Promise.all([
    prisma.product.findMany({
      where: q.where,
      orderBy: q.orderBy,
      skip: q.skip,
      take: q.take,
      include: { brand: true },
    }) as Promise<CatalogProduct[]>,
    prisma.product.count({ where: q.where }),
  ]);

  const pageCount = Math.ceil(count / CATALOG_PAGE_SIZE);

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

      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{category ? category.name : "همه‌ی محصولات"}</h1>

      <div className="mt-6 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CatalogFilterPanel
            basePath={basePath}
            subLabel={category ? "زیردسته‌ها" : "دسته‌بندی"}
            subOptions={subFacetRows.map((r) => ({ label: r.name, slug: r.slug }))}
            brandOptions={brandOptions}
            priceBounds={priceBounds}
          />
        </aside>

        <div className="mt-6 min-w-0 lg:mt-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground/60">{formatNumber(count)} محصول</p>
            <CatalogSortSelect basePath={basePath} />
          </div>

          {count === 0 ? (
            <EmptyState
              icon={<Boxes />}
              title="محصولی با این فیلترها یافت نشد."
              description="فیلترها را تغییر دهید یا پاک کنید."
            />
          ) : (
            <>
              <ProductGrid products={products} />
              <CatalogPagination page={q.page} pageCount={pageCount} makeHref={makeHref} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
