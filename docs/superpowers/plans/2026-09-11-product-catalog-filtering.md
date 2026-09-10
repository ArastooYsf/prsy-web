# Product Catalog Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Digikala-style `/products/[categorySlug]` catalog with a URL-state faceted filter panel, sort and pagination; make `/products/all` the same view unscoped; switch the header mega-menu to the real DB taxonomy and remove the admin-JSON category system.

**Architecture:** A server component `CatalogView` derives facet inputs + a Prisma query from `searchParams` (via a pure `buildCatalogQuery`), renders a breadcrumb, a client filter panel that pushes comma-joined params to the URL (mirroring the existing `ListFilterBar` pattern), a server-rendered product grid, and numbered `?page=` pagination. Two thin route files (`[categorySlug]`, `all`) feed it. A cached `getMenuTaxonomy()` replaces `getProductCategories()` everywhere the menu/showcase read categories, and the JSON `products.categories` blob and its editor are deleted.

**Tech Stack:** Next.js 14 App Router (server components + `dynamic = "force-dynamic"`), Prisma 7 (`@prisma/adapter-mariadb`, MySQL), `unstable_cache`/`revalidateTag`, Tailwind, framer-motion (existing menu animation), lucide-react, `next/image`.

**Spec:** `docs/superpowers/specs/2026-09-11-product-catalog-filtering-design.md`

## Global Constraints

- **No test framework in this repo.** Verification per task = `npx tsc --noEmit` clean + `npm run lint` clean + the task's explicit manual/CLI check. Do NOT add a test runner.
- **DB is MySQL.** No Prisma scalar lists. `Product.images`/`specs` are `Json`.
- **`npm run build` corrupts a running `next dev`'s `.next`.** Any step that runs `build` must first `pkill -f "next dev"`, and restart `npm run dev` (backgrounded) + `rm -rf .next` afterward if a dev server is needed again.
- **Prisma:** `import { prisma } from "@/lib/prisma"`; types `import type { Prisma } from "@/generated/prisma/client"`; runtime enum values are the string literals (`"IN_STOCK"` etc.).
- **All public + admin copy is Persian (fa-IR), RTL.** Numbers in Persian digits via `formatNumber` / `toPersianDigits` from `@/lib/format-number`.
- **Filter/sort/pagination state lives entirely in the query string** — shareable, refresh-safe. Changing any facet resets `page` to 1. Client components navigate with `router.push(url, { scroll: false })` (the `ListFilterBar` convention).
- **URL param schema:** `sub` = comma-joined slugs, `brand` = comma-joined slugs, `stock=1`, `priceMin`/`priceMax` = ints, `sort` ∈ `newest|price-asc|price-desc|name` (default `newest`), `page` ≥ 1 (default 1). Unknown values are ignored, never 404.
- **Page size:** `CATALOG_PAGE_SIZE = 24`.
- **Category icons** are keys of `CATEGORY_ICON_KEYS` from `@/lib/category-icons`; render with `CATEGORY_ICONS[key]`, fallback key `"box"`.
- **Media** paths are relative strings via `getMediaUrl` from `@/lib/media`.
- **Commit after every task**, conventional-commit message, `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer.
- Ignore the `graphify` git-hook "could not locate Python" warning — it does not affect commits.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `prisma/seed-catalog.ts` | Idempotent upsert of real brands / two-level categories / ~18 products. |
| `src/lib/catalog-query.ts` | `buildCatalogQuery` — `searchParams` → Prisma `where`/`orderBy` + page math; sort + page-size constants. |
| `src/components/products/ProductCard.tsx` | One product card (image, name, brand, availability pill, price-or-CTA). |
| `src/components/products/ProductGrid.tsx` | Responsive grid of `ProductCard`. |
| `src/components/products/Breadcrumb.tsx` | «همه‌ی محصولات › دسته › زیردسته». |
| `src/components/products/CatalogPagination.tsx` | Numbered `?page=` links, prev/next, windowed. |
| `src/components/products/CatalogSortSelect.tsx` | Client `<select>` writing `?sort=`. |
| `src/components/products/CatalogFilterPanel.tsx` | Client facet panel (subcategory/brand checkboxes, in-stock, price slider) writing the URL. |
| `src/components/products/CatalogView.tsx` | Server component: facet derivation + product query + assembles the page. |
| `src/app/products/[categorySlug]/page.tsx` | Category route → `CatalogView` with `category`. |
| `src/lib/menu-taxonomy.ts` | `getMenuTaxonomy()` — cached DB read of top categories + children + per-category brands. |

**Modified:**

| File | Change |
|---|---|
| `src/lib/list-query.ts` | Add `paramList(searchParams, key): string[]`. |
| `src/app/products/all/page.tsx` | Replace chunk-1 placeholder body with `<CatalogView basePath="/products/all" />`. |
| `src/components/ui/ProductsMegaMenu.tsx` | Consume `MenuCategory[]`; links → `/products/[slug]` + `?sub=` / `?brand=`. |
| `src/components/ui/MobileProductsAccordion.tsx` | Same data/link change. |
| `src/components/ui/header-2.tsx` | Prop `productCategories: ProductCategoryContent[]` → `menuCategories: MenuCategory[]`; thread to both menus. |
| `src/app/layout.tsx` | `getProductCategories()` → `getMenuTaxonomy()`; pass `menuCategories`. |
| `src/components/ProductCategories.tsx` | Props → `categories: MenuCategory[]`; cards link `/products/[slug]`; drop `conditions`/`DEFAULT_*` fallback. |
| `src/app/products/page.tsx` | Feed `ProductCategories` from `getMenuTaxonomy()`; keep the `/products/all` CTA. |
| `src/lib/site-content.ts` | Delete `getProductCategories`, `PRODUCT_CATEGORIES_KEY`, the `ProductCategoryContent`/`DEFAULT_PRODUCT_CATEGORIES` re-exports. |
| `src/lib/site-content-defaults.ts` | Delete `ProductCategoryContent` type + `DEFAULT_PRODUCT_CATEGORIES`. |
| `src/components/admin/SiteContentForm.tsx` | Remove the entire product-categories half; POST body becomes `{ heroSlides }`. |
| `src/app/api/admin/site-content/route.ts` | Remove `cleanProductCategory`, the `products.categories` upsert, the `productCategories` validation, `revalidatePath("/products")`. |
| `src/app/account/admin/content/page.tsx` | Drop `getProductCategories()` + `initialCategories`; update copy. |
| `src/app/api/admin/products/categories/route.ts` + `categories/[id]/route.ts` + `brands/route.ts` + `brands/[id]/route.ts` | Add `revalidateTag("product-taxonomy")` on each success path. |
| `package.json` | Add `"db:seed:catalog": "tsx prisma/seed-catalog.ts"`. |

---

## Task 1: Catalog seed script

**Files:**
- Create: `prisma/seed-catalog.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing.
- Produces: rows in `brands`, `product_categories`, `products`. Brand slugs: `caterpillar, cummins, perkins, volvo, weichai, stamford`. Top-category slugs: `diesel-generator, power-engine, spare-parts, generator-engine, alternator`. Subcategory slugs as listed in the spec §3. Later tasks assume these slugs exist for browser testing but do **not** import from this file.

- [ ] **Step 1: Add the npm script**

In `package.json` `"scripts"`, after `"db:seed"`:
```json
    "db:seed:catalog": "tsx prisma/seed-catalog.ts",
```

- [ ] **Step 2: Write `prisma/seed-catalog.ts`**

Mirror `prisma/seed.ts`'s adapter bootstrap. All writes are `upsert` keyed on `slug` (unique) so re-runs are safe.

```ts
import { config } from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? "") });

type SubSeed = { slug: string; name: string };
type CatSeed = { slug: string; name: string; icon: string; order: number; children: SubSeed[] };

const BRANDS: { slug: string; name: string; order: number }[] = [
  { slug: "caterpillar", name: "کاترپیلار", order: 1 },
  { slug: "cummins", name: "کامینز", order: 2 },
  { slug: "perkins", name: "پرکینز", order: 3 },
  { slug: "volvo", name: "ولوو", order: 4 },
  { slug: "weichai", name: "ویچای", order: 5 },
  { slug: "stamford", name: "استمفورد", order: 6 },
];

const CATEGORIES: CatSeed[] = [
  { slug: "diesel-generator", name: "دیزل ژنراتور", icon: "generator", order: 1, children: [
    { slug: "diesel-generator-industrial", name: "دیزل ژنراتور صنعتی" },
    { slug: "diesel-generator-marine", name: "دیزل ژنراتور دریایی" },
    { slug: "diesel-generator-portable", name: "دیزل ژنراتور پرتابل" },
  ]},
  { slug: "power-engine", name: "موتور برق", icon: "engine", order: 2, children: [
    { slug: "power-engine-gasoline", name: "موتور برق بنزینی" },
    { slug: "power-engine-diesel", name: "موتور برق دیزلی" },
  ]},
  { slug: "spare-parts", name: "قطعات یدکی", icon: "parts", order: 3, children: [
    { slug: "spare-parts-engine", name: "قطعات موتور" },
    { slug: "spare-parts-alternator", name: "قطعات آلترناتور" },
    { slug: "spare-parts-control", name: "قطعات تابلو کنترل" },
  ]},
  { slug: "generator-engine", name: "موتور ژنراتور", icon: "generator-engine", order: 4, children: [
    { slug: "generator-engine-cat", name: "موتور ژنراتور کاترپیلار" },
    { slug: "generator-engine-cummins", name: "موتور ژنراتور کامینز" },
  ]},
  { slug: "alternator", name: "دینام / آلترناتور", icon: "alternator", order: 5, children: [
    { slug: "alternator-brushless", name: "آلترناتور بدون جاروبک" },
    { slug: "alternator-brushed", name: "آلترناتور جاروبکی" },
  ]},
];

// [sub-slug, brand-slug, name, availability, showPrice, price|null]
const PRODUCTS: [string, string, string, "IN_STOCK" | "OUT_OF_STOCK" | "CALL", boolean, number | null][] = [
  ["diesel-generator-industrial", "caterpillar", "دیزل ژنراتور کاترپیلار ۵۰۰ کاوا", "IN_STOCK", true, 4500000000],
  ["diesel-generator-industrial", "cummins", "دیزل ژنراتور کامینز ۴۰۰ کاوا", "IN_STOCK", true, 3800000000],
  ["diesel-generator-industrial", "perkins", "دیزل ژنراتور پرکینز ۲۵۰ کاوا", "CALL", false, null],
  ["diesel-generator-marine", "volvo", "دیزل ژنراتور دریایی ولوو ۱۵۰ کاوا", "IN_STOCK", false, null],
  ["diesel-generator-marine", "cummins", "دیزل ژنراتور دریایی کامینز ۲۰۰ کاوا", "OUT_OF_STOCK", false, null],
  ["diesel-generator-portable", "weichai", "دیزل ژنراتور پرتابل ویچای ۲۰ کاوا", "IN_STOCK", true, 320000000],
  ["diesel-generator-portable", "perkins", "دیزل ژنراتور پرتابل پرکینز ۳۰ کاوا", "IN_STOCK", true, 410000000],
  ["power-engine-gasoline", "weichai", "موتور برق بنزینی ۵ کاوا", "IN_STOCK", true, 45000000],
  ["power-engine-gasoline", "cummins", "موتور برق بنزینی ۷ کاوا", "OUT_OF_STOCK", true, 62000000],
  ["power-engine-diesel", "perkins", "موتور برق دیزلی ۱۰ کاوا", "IN_STOCK", false, null],
  ["power-engine-diesel", "volvo", "موتور برق دیزلی ۱۵ کاوا", "CALL", false, null],
  ["spare-parts-engine", "caterpillar", "پکیج سرسیلندر کاترپیلار C15", "IN_STOCK", false, null],
  ["spare-parts-engine", "cummins", "واتر پمپ کامینز NTA855", "IN_STOCK", true, 28000000],
  ["spare-parts-alternator", "stamford", "دیود آلترناتور استمفورد", "IN_STOCK", false, null],
  ["spare-parts-control", "caterpillar", "برد کنترل کاترپیلار EMCP", "OUT_OF_STOCK", false, null],
  ["generator-engine-cat", "caterpillar", "موتور ژنراتور کاترپیلار C18", "CALL", false, null],
  ["generator-engine-cummins", "cummins", "موتور ژنراتور کامینز QSK19", "IN_STOCK", false, null],
  ["alternator-brushless", "stamford", "آلترناتور استمفورد UCI274", "IN_STOCK", true, 180000000],
];

const INACTIVE_SLUG = "seed-inactive-product";

async function main() {
  const brandIdBySlug = new Map<string, string>();
  for (const b of BRANDS) {
    const row = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, order: b.order },
      create: { slug: b.slug, name: b.name, order: b.order },
    });
    brandIdBySlug.set(b.slug, row.id);
  }

  const subIdBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const parent = await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: c.order, parentId: null },
      create: { slug: c.slug, name: c.name, icon: c.icon, order: c.order },
    });
    let i = 1;
    for (const s of c.children) {
      const sub = await prisma.productCategory.upsert({
        where: { slug: s.slug },
        update: { name: s.name, parentId: parent.id, order: i },
        create: { slug: s.slug, name: s.name, parentId: parent.id, order: i },
      });
      subIdBySlug.set(s.slug, sub.id);
      i += 1;
    }
  }

  for (const [subSlug, brandSlug, name, availability, showPrice, price] of PRODUCTS) {
    const slug = name
      .trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-").toLowerCase();
    await prisma.product.upsert({
      where: { slug },
      update: {
        name, categoryId: subIdBySlug.get(subSlug) ?? null, brandId: brandIdBySlug.get(brandSlug) ?? null,
        availability, showPrice, price, isActive: true, deletedAt: null,
        images: [], specs: [{ label: "برند", value: name.split(" ").pop() ?? "" }],
      },
      create: {
        name, slug, categoryId: subIdBySlug.get(subSlug) ?? null, brandId: brandIdBySlug.get(brandSlug) ?? null,
        availability, showPrice, price, isActive: true,
        images: [], specs: [{ label: "برند", value: name.split(" ").pop() ?? "" }],
      },
    });
  }

  await prisma.product.upsert({
    where: { slug: INACTIVE_SLUG },
    update: { name: "محصول غیرفعال (seed)", isActive: false, categoryId: subIdBySlug.get("diesel-generator-industrial") ?? null, images: [], specs: [] },
    create: { slug: INACTIVE_SLUG, name: "محصول غیرفعال (seed)", isActive: false, categoryId: subIdBySlug.get("diesel-generator-industrial") ?? null, images: [], specs: [] },
  });

  console.log(`seeded ${BRANDS.length} brands, ${CATEGORIES.length} categories, ${PRODUCTS.length + 1} products`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
```

- [ ] **Step 3: Run it twice**

Run: `npm run db:seed:catalog && npm run db:seed:catalog`
Expected: both runs print the "seeded …" line and exit 0; the second run creates no duplicates (all upserts).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean. (`prisma/*.ts` is included by `tsconfig`.)

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-catalog.ts package.json
git commit -m "$(cat <<'EOF'
feat(catalog): add idempotent catalog seed script (brands, categories, products)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Query layer — `paramList` + `buildCatalogQuery`

**Files:**
- Modify: `src/lib/list-query.ts` (append `paramList`)
- Create: `src/lib/catalog-query.ts`

**Interfaces:**
- Consumes: `param`, `ListSearchParams` from `@/lib/list-query`; `type Prisma` from `@/generated/prisma/client`.
- Produces:
  - `paramList(searchParams: ListSearchParams, key: string): string[]`
  - `CATALOG_PAGE_SIZE = 24`, `CATALOG_SORTS`, `type CatalogSort`
  - `type CatalogQueryInput`, `type CatalogQuery` (both per spec §4.2)
  - `buildCatalogQuery(input: CatalogQueryInput): CatalogQuery`

- [ ] **Step 1: Append `paramList` to `src/lib/list-query.ts`**

```ts
/** Multi-value query param: "a,b,c" -> ["a","b","c"] (trimmed, non-empty, de-duped). */
export function paramList(searchParams: ListSearchParams, key: string): string[] {
  const raw = param(searchParams, key);
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}
```

- [ ] **Step 2: Write `src/lib/catalog-query.ts`**

```ts
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
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. If `price: { sort, nulls }` errors, the Prisma version may not support `nulls` on this field — fall back to `{ price: "asc" }` / `{ price: "desc" }` and note it in the report.

- [ ] **Step 4: Commit**

```bash
git add src/lib/list-query.ts src/lib/catalog-query.ts
git commit -m "$(cat <<'EOF'
feat(catalog): add paramList + buildCatalogQuery for faceted product filtering

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Presentational components — card, grid, breadcrumb, pagination

**Files:**
- Create: `src/components/products/ProductCard.tsx`
- Create: `src/components/products/ProductGrid.tsx`
- Create: `src/components/products/Breadcrumb.tsx`
- Create: `src/components/products/CatalogPagination.tsx`

**Interfaces:**
- Consumes: `getMediaUrl` (`@/lib/media`), `PRODUCT_AVAILABILITY` (`@/lib/status-labels`), `formatNumber` / `toPersianDigits` (`@/lib/format-number`), `type Prisma` (`@/generated/prisma/client`).
- Produces:
  - `type CatalogProduct = Prisma.ProductGetPayload<{ include: { brand: true } }>` (exported from `ProductCard.tsx`)
  - `<ProductCard product={CatalogProduct} />`
  - `<ProductGrid products={CatalogProduct[]} />`
  - `<Breadcrumb items={{ label: string; href?: string }[]} />` — last item has no `href`, rendered `aria-current="page"`
  - `<CatalogPagination page={number} pageCount={number} makeHref={(page: number) => string} />` — renders nothing when `pageCount <= 1`

- [ ] **Step 1: Write `src/components/products/ProductCard.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import type { Prisma } from "@/generated/prisma/client";

export type CatalogProduct = Prisma.ProductGetPayload<{ include: { brand: true } }>;

function firstImage(images: Prisma.JsonValue): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const img = firstImage(product.images);
  const availability = PRODUCT_AVAILABILITY[product.availability] ?? PRODUCT_AVAILABILITY.IN_STOCK;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] transition-colors hover:border-accent-500/40">
      <div className="relative aspect-square w-full overflow-hidden bg-foreground/5">
        {img ? (
          <Image
            src={getMediaUrl(img)}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-foreground/25">
            <ImageOff className="size-8" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-6">{product.name}</h3>

        <div className="flex flex-wrap items-center gap-1.5">
          {product.brand && (
            <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-[11px] text-foreground/60">
              {product.brand.name}
            </span>
          )}
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${availability.className}`}>
            {availability.label}
          </span>
        </div>

        <div className="mt-auto pt-2">
          {product.showPrice && product.price != null ? (
            <p dir="ltr" className="text-right text-sm font-bold text-foreground">
              {formatNumber(product.price)} تومان
            </p>
          ) : (
            <Link
              href="/contact"
              className="inline-flex min-h-9 items-center rounded-full border border-accent-500/40 px-4 text-xs font-semibold text-accent-500 transition-colors hover:bg-accent-500/10"
            >
              درخواست قیمت
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/products/ProductGrid.tsx`**

```tsx
import ProductCard, { type CatalogProduct } from "@/components/products/ProductCard";

export default function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/products/Breadcrumb.tsx`**

```tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسیر ناوبری" className="flex flex-wrap items-center gap-1.5 text-xs text-foreground/50">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !last ? (
              <Link href={item.href} className="transition-colors hover:text-accent-500">
                {item.label}
              </Link>
            ) : (
              <span aria-current={last ? "page" : undefined} className={last ? "text-foreground/80" : undefined}>
                {item.label}
              </span>
            )}
            {!last && <ChevronLeft aria-hidden className="size-3.5 text-foreground/25" />}
          </span>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Write `src/components/products/CatalogPagination.tsx`**

```tsx
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { toPersianDigits } from "@/lib/format-number";

function windowed(page: number, pageCount: number): number[] {
  const span = 2;
  const start = Math.max(1, page - span);
  const end = Math.min(pageCount, page + span);
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

export default function CatalogPagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const pages = windowed(page, pageCount);

  const cell =
    "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-foreground/10 px-3 text-sm font-medium transition-colors";

  return (
    <nav aria-label="صفحه‌بندی" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {/* RTL: "prev" (newer page number - 1) points right */}
      {page > 1 && (
        <Link href={makeHref(page - 1)} className={`${cell} hover:border-accent-500/40`} aria-label="صفحه قبل">
          <ChevronRight className="size-4" />
        </Link>
      )}
      {pages[0] > 1 && <span className="px-1 text-foreground/30">…</span>}
      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${cell} ${p === page ? "border-accent-500 bg-accent-500/10 text-accent-500" : "hover:border-accent-500/40"}`}
        >
          {toPersianDigits(p)}
        </Link>
      ))}
      {pages[pages.length - 1] < pageCount && <span className="px-1 text-foreground/30">…</span>}
      {page < pageCount && (
        <Link href={makeHref(page + 1)} className={`${cell} hover:border-accent-500/40`} aria-label="صفحه بعد">
          <ChevronLeft className="size-4" />
        </Link>
      )}
    </nav>
  );
}
```

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/products/ProductCard.tsx src/components/products/ProductGrid.tsx src/components/products/Breadcrumb.tsx src/components/products/CatalogPagination.tsx
git commit -m "$(cat <<'EOF'
feat(catalog): add product card, grid, breadcrumb, pagination components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Client facet components — sort select + filter panel

**Files:**
- Create: `src/components/products/CatalogSortSelect.tsx`
- Create: `src/components/products/CatalogFilterPanel.tsx`

**Interfaces:**
- Consumes: `useRouter`, `useSearchParams` from `next/navigation`; `CATALOG_SORTS` from `@/lib/catalog-query`.
- Produces:
  - `type FacetOption = { label: string; slug: string }`
  - `<CatalogSortSelect basePath={string} />`
  - `<CatalogFilterPanel basePath={string} subLabel={string} subOptions={FacetOption[]} brandOptions={FacetOption[]} priceBounds={{ min: number; max: number } | null} />`
- Both mutate the URL via `router.push(\`${basePath}?${qs}\`, { scroll: false })`, always deleting `page`.

- [ ] **Step 1: Write `src/components/products/CatalogSortSelect.tsx`**

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATALOG_SORTS } from "@/lib/catalog-query";

const SORT_LABELS: Record<(typeof CATALOG_SORTS)[number], string> = {
  newest: "جدیدترین",
  "price-asc": "ارزان‌ترین",
  "price-desc": "گران‌ترین",
  name: "نام",
};

export default function CatalogSortSelect({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "newest") params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2 text-sm text-foreground/70">
      <span className="shrink-0">مرتب‌سازی:</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-sm outline-none transition-colors focus:border-accent-500/50"
      >
        {CATALOG_SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 2: Write `src/components/products/CatalogFilterPanel.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { formatNumber } from "@/lib/format-number";

export type FacetOption = { label: string; slug: string };

type Props = {
  basePath: string;
  subLabel: string;
  subOptions: FacetOption[];
  brandOptions: FacetOption[];
  priceBounds: { min: number; max: number } | null;
};

function splitParam(v: string | null): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export default function CatalogFilterPanel({ basePath, subLabel, subOptions, brandOptions, priceBounds }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openMobile, setOpenMobile] = useState(false);

  const subs = splitParam(searchParams.get("sub"));
  const brands = splitParam(searchParams.get("brand"));
  const stockOnly = searchParams.get("stock") === "1";

  const pushParams = (mutate: (p: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  const toggleList = (key: "sub" | "brand", slug: string) => {
    pushParams((p) => {
      const cur = splitParam(p.get(key));
      const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
      if (next.length) p.set(key, next.join(","));
      else p.delete(key);
    });
  };

  const toggleStock = () => pushParams((p) => (stockOnly ? p.delete("stock") : p.set("stock", "1")));

  const hasActive =
    subs.length > 0 || brands.length > 0 || stockOnly || searchParams.has("priceMin") || searchParams.has("priceMax");

  const clearAll = () => router.push(basePath, { scroll: false });

  // --- price slider (debounced) ---
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!priceBounds) return;
    const qpMin = searchParams.get("priceMin");
    const qpMax = searchParams.get("priceMax");
    setPriceMin(qpMin !== null ? Number(qpMin) : priceBounds.min);
    setPriceMax(qpMax !== null ? Number(qpMax) : priceBounds.max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, priceBounds?.min, priceBounds?.max]);

  const commitPrice = (min: number, max: number) => {
    if (priceTimer.current) clearTimeout(priceTimer.current);
    priceTimer.current = setTimeout(() => {
      pushParams((p) => {
        if (priceBounds && min > priceBounds.min) p.set("priceMin", String(Math.round(min)));
        else p.delete("priceMin");
        if (priceBounds && max < priceBounds.max) p.set("priceMax", String(Math.round(max)));
        else p.delete("priceMax");
      });
    }, 320);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-foreground/10 py-4 first:pt-0 last:border-b-0">
      <p className="mb-2.5 text-sm font-bold text-foreground/80">{title}</p>
      {children}
    </div>
  );

  const CheckRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-foreground/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-foreground/20 accent-accent-500"
      />
      <span className="flex-1">{label}</span>
    </label>
  );

  const body = (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="size-4 text-accent-500" />
          فیلترها
        </p>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground/50 transition-colors hover:text-red-400"
          >
            <X className="size-3.5" />
            پاک‌کردن
          </button>
        )}
      </div>

      {subOptions.length > 0 && (
        <Section title={subLabel}>
          {subOptions.map((o) => (
            <CheckRow key={o.slug} label={o.label} checked={subs.includes(o.slug)} onChange={() => toggleList("sub", o.slug)} />
          ))}
        </Section>
      )}

      {brandOptions.length > 0 && (
        <Section title="برند">
          {brandOptions.map((o) => (
            <CheckRow key={o.slug} label={o.label} checked={brands.includes(o.slug)} onChange={() => toggleList("brand", o.slug)} />
          ))}
        </Section>
      )}

      <Section title="موجودی">
        <CheckRow label="فقط کالاهای موجود" checked={stockOnly} onChange={toggleStock} />
      </Section>

      {priceBounds && priceMin !== null && priceMax !== null && (
        <Section title="بازه‌ی قیمت (تومان)">
          <div className="flex items-center justify-between text-xs text-foreground/60" dir="ltr">
            <span>{formatNumber(priceMin)}</span>
            <span>{formatNumber(priceMax)}</span>
          </div>
          <div className="mt-2 space-y-2" dir="ltr">
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={priceMin}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), priceMax);
                setPriceMin(v);
                commitPrice(v, priceMax);
              }}
              className="w-full accent-accent-500"
              aria-label="کمترین قیمت"
            />
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={priceMax}
              onChange={(e) => {
                const v = Math.max(Number(e.target.value), priceMin);
                setPriceMax(v);
                commitPrice(priceMin, v);
              }}
              className="w-full accent-accent-500"
              aria-label="بیشترین قیمت"
            />
          </div>
        </Section>
      )}
    </div>
  );

  return (
    <>
      {/* mobile: disclosure */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          aria-expanded={openMobile}
          className="inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-foreground/10 px-4 text-sm font-semibold"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-accent-500" />
            فیلترها{hasActive ? " (فعال)" : ""}
          </span>
        </button>
        {openMobile && <div className="mt-3">{body}</div>}
      </div>
      {/* desktop: always visible */}
      <div className="hidden lg:block">{body}</div>
    </>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/products/CatalogSortSelect.tsx src/components/products/CatalogFilterPanel.tsx
git commit -m "$(cat <<'EOF'
feat(catalog): add URL-state filter panel and sort select

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `CatalogView` server component

**Files:**
- Create: `src/components/products/CatalogView.tsx`

**Interfaces:**
- Consumes: `prisma` (`@/lib/prisma`); `buildCatalogQuery`, `CATALOG_PAGE_SIZE` (`@/lib/catalog-query`); `type ListSearchParams` (`@/lib/list-query`); `ProductGrid` + `type CatalogProduct`, `Breadcrumb` + `type Crumb`, `CatalogPagination`, `CatalogSortSelect`, `CatalogFilterPanel` + `type FacetOption`; `EmptyState` (`@/components/ui/EmptyState`); `formatNumber` (`@/lib/format-number`); `Boxes` icon.
- Produces: `<CatalogView category? basePath searchParams />` (default export) per spec §5.

- [ ] **Step 1: Write `src/components/products/CatalogView.tsx`**

```tsx
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
  const validSubSlugs = new Map(subFacetRows.map((r) => [r.slug, r.id]));

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
    orderBy: { brand: { order: "asc" } },
  });
  const brandOptions: FacetOption[] = brandRows
    .map((r) => r.brand)
    .filter((b): b is { id: string; name: string; slug: string } => Boolean(b))
    .map((b) => ({ label: b.name, slug: b.slug }));
  const validBrandSlugs = new Map(brandOptions.map((b) => [b.slug, b.slug === b.slug ? b.slug : b.slug]));
  // buildCatalogQuery needs slug->id; fetch that map once:
  const brandIdBySlug = new Map(brandRows.map((r) => r.brand!).filter(Boolean).map((b) => [b.slug, b.id]));

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
  const soleSub = paramList(searchParams, "sub").length === 1 ? paramList(searchParams, "sub")[0] : null;
  if (soleSub) {
    const s = subFacetRows.find((r) => r.slug === soleSub);
    if (s) crumbs.push({ label: s.name });
  }
  if (crumbs.length > 1 && !crumbs[crumbs.length - 1].href) {
    // last crumb has no href -> fine
  } else {
    crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label };
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
            <EmptyState icon={<Boxes />} title="محصولی با این فیلترها یافت نشد." description="فیلترها را تغییر دهید یا پاک کنید." />
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
```

Note: the `validBrandSlugs` line above is intentionally simplified — `buildCatalogQuery` needs a `Map<brandSlug, brandId>`, which is `brandIdBySlug`. Pass `brandIdBySlug` as `validBrandSlugs` (the param name in `CatalogQueryInput`) and delete the dead `validBrandSlugs` local. Clean this up while implementing.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. Fix the `validBrandSlugs`/`brandIdBySlug` duplication noted above so there is exactly one slug→id map passed to `buildCatalogQuery`. If `orderBy: { brand: { order: "asc" } }` with `distinct` errors, drop the `orderBy` and sort `brandOptions` by `label` with `localeCompare("fa")` in JS.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/CatalogView.tsx
git commit -m "$(cat <<'EOF'
feat(catalog): add CatalogView server component (facets + product query)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Routes — `/products/[categorySlug]` + `/products/all` rewrite

**Files:**
- Create: `src/app/products/[categorySlug]/page.tsx`
- Modify: `src/app/products/all/page.tsx` (replace the placeholder body)

**Interfaces:**
- Consumes: `prisma`, `CatalogView`, `notFound` (`next/navigation`), `type Metadata` (`next`), `type ListSearchParams` (`@/lib/list-query`).
- Produces: two reachable routes. `/products/[categorySlug]` 404s for unknown slugs and for subcategory slugs (`parentId != null`).

- [ ] **Step 1: Write `src/app/products/[categorySlug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CatalogView from "@/components/products/CatalogView";
import type { ListSearchParams } from "@/lib/list-query";

export const dynamic = "force-dynamic";

async function loadCategory(slug: string) {
  return prisma.productCategory.findUnique({
    where: { slug },
    include: { children: { orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } } },
  });
}

export async function generateMetadata({ params }: { params: { categorySlug: string } }): Promise<Metadata> {
  const category = await loadCategory(params.categorySlug);
  if (!category || category.parentId) return { title: "محصولات" };
  return {
    title: category.name,
    description: `خرید ${category.name} از برندهای معتبر جهانی؛ مشاهده مشخصات، مقایسه و استعلام قیمت.`,
  };
}

export default async function CategoryCatalogPage({
  params,
  searchParams,
}: {
  params: { categorySlug: string };
  searchParams: ListSearchParams;
}) {
  const category = await loadCategory(params.categorySlug);
  if (!category || category.parentId) notFound();

  return (
    <CatalogView
      basePath={`/products/${category.slug}`}
      searchParams={searchParams}
      category={{ id: category.id, name: category.name, slug: category.slug, children: category.children }}
    />
  );
}
```

- [ ] **Step 2: Rewrite `src/app/products/all/page.tsx`**

Keep the existing `import type { Metadata }`, `metadata` export (title «همه‌ی محصولات»), and `export const dynamic = "force-dynamic"`. Replace the component body:

```tsx
import type { Metadata } from "next";
import CatalogView from "@/components/products/CatalogView";
import type { ListSearchParams } from "@/lib/list-query";

export const metadata: Metadata = {
  title: "همه‌ی محصولات",
  description: "فهرست کامل محصولات پرسی؛ دیزل ژنراتور، موتور برق، قطعات یدکی و موتور ژنراتور از برندهای معتبر جهانی.",
};

export const dynamic = "force-dynamic";

export default function AllProductsPage({ searchParams }: { searchParams: ListSearchParams }) {
  return <CatalogView basePath="/products/all" searchParams={searchParams} />;
}
```

- [ ] **Step 3: Typecheck + lint + build**

Run: `pkill -f "next dev" 2>/dev/null; npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean; `build` lists `/products/[categorySlug]` and `/products/all` as `ƒ` routes.
Then restart the dev server for the manual check: `rm -rf .next && (npm run dev &)`.

- [ ] **Step 4: Manual check (dev server + seeded data)**

Ensure `npm run db:seed:catalog` has been run. Then in a browser:
- `/products/all` → grid of products, filter panel with a «دسته‌بندی» section listing the 5 top categories, «برند» section, «فقط کالاهای موجود», price slider (seed has priced products), sort dropdown, «۱۹ محصول» count minus the inactive one (should be 18), pagination hidden (18 < 24).
- `/products/diesel-generator` → only diesel-generator products; «زیردسته‌ها» = its 3 children; breadcrumb «همه‌ی محصولات › دیزل ژنراتور».
- `/products/diesel-generator?sub=diesel-generator-portable` → only the 2 portable products; breadcrumb adds «دیزل ژنراتور پرتابل».
- `/products/diesel-generator?brand=caterpillar` → only CAT diesel products.
- `/products/does-not-exist` → 404. `/products/diesel-generator-portable` (a subcategory slug) → 404.
- `/products/all?sort=price-asc` → priced products first ascending, unpriced last.
- Copy any filtered URL to a new tab → identical results.

- [ ] **Step 5: Commit**

```bash
git add "src/app/products/[categorySlug]/page.tsx" src/app/products/all/page.tsx
git commit -m "$(cat <<'EOF'
feat(catalog): add /products/[categorySlug] route, make /products/all the full catalog

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: DB-driven menu (`menu-taxonomy` + both menu components + header + layout)

**Files:**
- Create: `src/lib/menu-taxonomy.ts`
- Modify: `src/components/ui/ProductsMegaMenu.tsx` (full data/link rewrite; keep animation)
- Modify: `src/components/ui/MobileProductsAccordion.tsx` (same)
- Modify: `src/components/ui/header-2.tsx` (prop rename + retype + threading)
- Modify: `src/app/layout.tsx` (`getProductCategories` → `getMenuTaxonomy`)

This is one task because the four consumers won't typecheck until they all move to the new shape together.

**Interfaces:**
- Consumes: `prisma`, `unstable_cache` (`next/cache`), `type CategoryIconKey` (`@/lib/category-icons`).
- Produces:
  - `type MenuBrand = { id: string; name: string; slug: string }`
  - `type MenuCategory = { id: string; name: string; slug: string; icon: CategoryIconKey | null; children: { id: string; name: string; slug: string }[]; brands: MenuBrand[] }`
  - `type MenuTaxonomy = { categories: MenuCategory[] }`
  - `getMenuTaxonomy(): Promise<MenuTaxonomy>`
  - `Header` prop becomes `menuCategories?: MenuCategory[]` (default `[]`).
  - `ProductsMegaMenu` / `MobileProductsAccordion` prop becomes `categories: MenuCategory[]`.

- [ ] **Step 1: Write `src/lib/menu-taxonomy.ts`**

```ts
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ICON_KEYS, type CategoryIconKey } from "@/lib/category-icons";

export type MenuBrand = { id: string; name: string; slug: string };
export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  icon: CategoryIconKey | null;
  children: { id: string; name: string; slug: string }[];
  brands: MenuBrand[];
};
export type MenuTaxonomy = { categories: MenuCategory[] };

export const PRODUCT_TAXONOMY_TAG = "product-taxonomy";

function normalizeIcon(icon: string | null): CategoryIconKey | null {
  return icon && (CATEGORY_ICON_KEYS as readonly string[]).includes(icon) ? (icon as CategoryIconKey) : null;
}

async function loadMenuTaxonomy(): Promise<MenuTaxonomy> {
  try {
    const [roots, brandProductRows] = await Promise.all([
      prisma.productCategory.findMany({
        where: { parentId: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          children: { orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true, deletedAt: null, brandId: { not: null } },
        select: { categoryId: true, brand: { select: { id: true, name: true, slug: true } } },
        distinct: ["categoryId", "brandId"],
      }),
    ]);

    // Map every category id (root or child) -> its root id.
    const rootIdByAnyCat = new Map<string, string>();
    for (const root of roots) {
      rootIdByAnyCat.set(root.id, root.id);
      for (const child of root.children) rootIdByAnyCat.set(child.id, root.id);
    }

    const brandsByRoot = new Map<string, Map<string, MenuBrand>>();
    for (const row of brandProductRows) {
      if (!row.brand || !row.categoryId) continue;
      const rootId = rootIdByAnyCat.get(row.categoryId);
      if (!rootId) continue;
      if (!brandsByRoot.has(rootId)) brandsByRoot.set(rootId, new Map());
      brandsByRoot.get(rootId)!.set(row.brand.id, row.brand);
    }

    return {
      categories: roots.map((root) => ({
        id: root.id,
        name: root.name,
        slug: root.slug,
        icon: normalizeIcon(root.icon),
        children: root.children,
        brands: [...(brandsByRoot.get(root.id)?.values() ?? [])].sort((a, b) => a.name.localeCompare(b.name, "fa")),
      })),
    };
  } catch {
    return { categories: [] };
  }
}

export const getMenuTaxonomy = unstable_cache(loadMenuTaxonomy, ["menu-taxonomy"], {
  tags: [PRODUCT_TAXONOMY_TAG],
  revalidate: 300,
});
```

- [ ] **Step 2: Rewrite `src/components/ui/ProductsMegaMenu.tsx`**

Keep every constant (`CLOSE_DELAY`, transitions), the `useState`/`useRef`/timer scaffolding, `handleEnter`/`handleLeave`, the outer wrapper markup and `AnimatePresence`/`motion` structure **exactly as-is**. Change only: the import + prop type, the empty-case link, the rail item link + icon, and the panel content (subcategories + brands instead of description + brands).

```tsx
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { MenuCategory } from "@/lib/menu-taxonomy";
import { cn } from "@/lib/utils";

const CLOSE_DELAY = 180;
const OPEN_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };
const CLOSE_TRANSITION = { duration: 0.16, ease: "easeIn" as const };
const PANEL_SWAP_TRANSITION = { duration: 0.14, ease: [0.16, 1, 0.3, 1] as const };

type ProductsMegaMenuProps = {
  categories: MenuCategory[];
  onBumpEnter?: (el: HTMLElement) => void;
  onBumpLeave?: () => void;
};

export function ProductsMegaMenu({ categories, onBumpEnter, onBumpLeave }: ProductsMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | undefined>(categories[0]?.id);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center px-0.5">
        <Link
          href="/products/all"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm", className: "px-2.5" }),
            "hover:bg-transparent hover:text-foreground",
          )}
          onMouseEnter={(e) => onBumpEnter?.(e.currentTarget)}
          onMouseLeave={() => onBumpLeave?.()}
        >
          محصولات
        </Link>
      </div>
    );
  }

  const activeCategory = categories.find((c) => c.id === activeId) ?? categories[0];

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const handleEnter = () => {
    clearCloseTimer();
    if (!open) setActiveId(categories[0]?.id);
    setOpen(true);
  };
  const handleLeave = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  return (
    <div
      className="relative flex h-full items-center px-0.5"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <Link
        href="/products/all"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5 px-2.5" }),
          "hover:bg-transparent hover:text-foreground",
        )}
        aria-haspopup="true"
        aria-expanded={open}
        onMouseEnter={(e) => onBumpEnter?.(e.currentTarget)}
        onMouseLeave={() => onBumpLeave?.()}
      >
        محصولات
        <ChevronDown aria-hidden className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: OPEN_TRANSITION }}
            exit={{ opacity: 0, y: -8, transition: CLOSE_TRANSITION }}
            className="absolute right-0 top-full z-50 mt-2 w-[37rem] max-w-[calc(100vw-2rem)]"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-black/40">
              <div className="flex min-h-[17rem] max-h-[calc(100vh-8rem)]">
                <ul className="w-56 shrink-0 overflow-y-auto border-l border-border bg-foreground/[0.03] p-2">
                  {categories.map((category) => {
                    const isActive = category.id === activeCategory.id;
                    return (
                      <li key={category.id}>
                        <Link
                          href={`/products/${category.slug}`}
                          onClick={() => setOpen(false)}
                          onMouseEnter={() => setActiveId(category.id)}
                          onFocus={() => setActiveId(category.id)}
                          className={cn(
                            "group flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-medium leading-snug transition-colors",
                            isActive ? "bg-accent-500/10 text-accent-500" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors [&_svg]:size-4",
                              isActive ? "bg-accent-500/15 text-accent-500" : "bg-foreground/5 text-foreground/50",
                            )}
                          >
                            {CATEGORY_ICONS[category.icon ?? "box"]}
                          </span>
                          <span className="min-w-0 flex-1">{category.name}</span>
                          <ChevronLeft
                            aria-hidden
                            className={cn(
                              "size-4 shrink-0 transition-all",
                              isActive ? "text-accent-500 opacity-100" : "-translate-x-1 text-foreground/30 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                            )}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <div className="min-w-0 flex-1 overflow-y-auto p-5">
                  <motion.div key={activeCategory.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={PANEL_SWAP_TRANSITION}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500 [&_svg]:size-5">
                          {CATEGORY_ICONS[activeCategory.icon ?? "box"]}
                        </span>
                        <h3 className="text-sm font-bold">{activeCategory.name}</h3>
                      </div>
                      <Link
                        href={`/products/${activeCategory.slug}`}
                        onClick={() => setOpen(false)}
                        className="group inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent-500 transition-colors hover:bg-accent-500/10"
                      >
                        مشاهده همه
                        <ArrowLeft aria-hidden className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                      </Link>
                    </div>

                    {activeCategory.children.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">زیردسته‌ها</p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {activeCategory.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/products/${activeCategory.slug}?sub=${child.slug}`}
                                onClick={() => setOpen(false)}
                                className="group flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-accent-500"
                              >
                                <span className="truncate">{child.name}</span>
                                <ArrowLeft aria-hidden className="size-3 shrink-0 -translate-x-1 text-foreground/20 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-accent-500 group-hover:opacity-100" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeCategory.brands.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">برندها</p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {activeCategory.brands.map((brand) => (
                            <li key={brand.id}>
                              <Link
                                href={`/products/${activeCategory.slug}?brand=${brand.slug}`}
                                onClick={() => setOpen(false)}
                                className="group flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-accent-500"
                              >
                                <span className="truncate">{brand.name}</span>
                                <ArrowLeft aria-hidden className="size-3 shrink-0 -translate-x-1 text-foreground/20 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-accent-500 group-hover:opacity-100" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `src/components/ui/MobileProductsAccordion.tsx`**

Keep the component's `open`/`openCategoryId` state, the `useEffect` reset on `drawerOpen`, and the `grid-rows-[0fr]/[1fr]` animation wrappers exactly. Change import + prop type, the empty-case link (`/products/all`), the level-2 content (subcategory links + brand chips → brand links), and the "مشاهده همه" link.

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { MenuCategory } from "@/lib/menu-taxonomy";
import { cn } from "@/lib/utils";

export function MobileProductsAccordion({
  categories,
  drawerOpen,
  onNavigate,
}: {
  categories: MenuCategory[];
  drawerOpen: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!drawerOpen) {
      setOpen(false);
      setOpenCategoryId(null);
    }
  }, [drawerOpen]);

  if (categories.length === 0) {
    return (
      <Link className={buttonVariants({ variant: "ghost", className: "justify-start" })} href="/products/all" onClick={onNavigate}>
        محصولات
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={buttonVariants({ variant: "ghost", className: "w-full justify-between" })}
      >
        محصولات
        <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", open && "rotate-180")} />
      </button>

      <div
        aria-hidden={!open}
        className={cn("grid overflow-hidden transition-all duration-300", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
      >
        <div className="min-h-0">
          <div className="mt-1 mr-2 flex flex-col gap-0.5 border-r border-foreground/10 pr-3">
            {categories.map((category) => {
              const isCategoryOpen = openCategoryId === category.id;
              return (
                <div key={category.id}>
                  <button
                    type="button"
                    onClick={() => setOpenCategoryId(isCategoryOpen ? null : category.id)}
                    aria-expanded={isCategoryOpen}
                    tabIndex={open ? 0 : -1}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-right text-sm text-foreground/80 transition-colors hover:bg-foreground/5"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 [&_svg]:size-4">
                      {CATEGORY_ICONS[category.icon ?? "box"]}
                    </span>
                    <span className="flex-1">{category.name}</span>
                    <ChevronDown aria-hidden className={cn("size-3.5 shrink-0 text-foreground/40 transition-transform duration-300", isCategoryOpen && "rotate-180")} />
                  </button>

                  <div
                    aria-hidden={!isCategoryOpen}
                    className={cn("grid overflow-hidden transition-all duration-300", isCategoryOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
                  >
                    <div className="min-h-0">
                      {category.children.length > 0 && (
                        <ul className="flex flex-col py-1 pr-9 pl-2">
                          {category.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/products/${category.slug}?sub=${child.slug}`}
                                onClick={onNavigate}
                                tabIndex={open && isCategoryOpen ? 0 : -1}
                                className="block rounded-md px-2 py-2 text-xs text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-accent-400"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                      {category.brands.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 py-2 pr-9 pl-2">
                          {category.brands.map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/products/${category.slug}?brand=${brand.slug}`}
                              onClick={onNavigate}
                              tabIndex={open && isCategoryOpen ? 0 : -1}
                              className="rounded-md bg-foreground/5 px-2 py-1 text-xs text-foreground/60 transition-colors hover:bg-accent-500/10 hover:text-accent-400"
                            >
                              {brand.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      <Link
                        href={`/products/${category.slug}`}
                        onClick={onNavigate}
                        tabIndex={open && isCategoryOpen ? 0 : -1}
                        className="mb-2 mr-9 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-400"
                      >
                        مشاهده همه {category.name}
                        <ArrowLeft className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `src/components/ui/header-2.tsx`**

- Line ~25: `import type { ProductCategoryContent } from '@/lib/site-content-defaults';` → `import type { MenuCategory } from '@/lib/menu-taxonomy';`
- Line ~108: `export function Header({ productCategories = [] }: { productCategories?: ProductCategoryContent[] }) {` → `export function Header({ menuCategories = [] }: { menuCategories?: MenuCategory[] }) {`
- Line ~470: `<ProductsMegaMenu categories={productCategories} …/>` → `categories={menuCategories}`
- Line ~545: `<MobileProductsAccordion categories={productCategories} …/>` → `categories={menuCategories}`

- [ ] **Step 5: Update `src/app/layout.tsx`**

- Line 14: `import { getFooterContact, getProductCategories } from "@/lib/site-content";` → `import { getFooterContact } from "@/lib/site-content";` + new line `import { getMenuTaxonomy } from "@/lib/menu-taxonomy";`
- Line 83: `const [footerContact, productCategories] = await Promise.all([getFooterContact(), getProductCategories()]);` → `const [footerContact, menuTaxonomy] = await Promise.all([getFooterContact(), getMenuTaxonomy()]);`
- Line ~142: `<Header productCategories={productCategories} />` → `<Header menuCategories={menuTaxonomy.categories} />`

- [ ] **Step 6: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. (`ProductCategories.tsx` and the JSON system still compile — they're untouched here and Task 8/9 handle them. `getProductCategories` still exists in `site-content.ts` until Task 9.)

- [ ] **Step 7: Manual check**

Restart dev server if needed. As any visitor, open the header on desktop: the «محصولات» mega-menu rail lists the 5 seeded categories; hovering one shows its subcategories + brands; clicking the category → `/products/[slug]`; clicking a subcategory → `/products/[slug]?sub=[childSlug]` and the catalog filters to it. On a 375px viewport, open the drawer → «محصولات» accordion → a category → subcategory links + brand chips work.

- [ ] **Step 8: Commit**

```bash
git add src/lib/menu-taxonomy.ts src/components/ui/ProductsMegaMenu.tsx src/components/ui/MobileProductsAccordion.tsx src/components/ui/header-2.tsx src/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat(catalog): drive header mega-menu from the DB product taxonomy

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `ProductCategories` showcase + `/products` page → DB categories

**Files:**
- Modify: `src/components/ProductCategories.tsx`
- Modify: `src/app/products/page.tsx`

**Interfaces:**
- Consumes: `type MenuCategory` (`@/lib/menu-taxonomy`), `getMenuTaxonomy` (`@/lib/menu-taxonomy`), `CATEGORY_ICONS` (`@/lib/category-icons`), `EmptyState`.
- Produces: `<ProductCategories categories={MenuCategory[]} />` — each card is a `<Link href={\`/products/${slug}\`}>`.

- [ ] **Step 1: Rewrite `src/components/ProductCategories.tsx`**

Keep `"use client"`, the framer-motion imports, `useSiteTheme`, the section heading block, and the outer grid `motion.div`. Replace the props, the `CONDITION_BADGE` block (delete), and the card body.

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { MenuCategory } from "@/lib/menu-taxonomy";

type ProductCategoriesProps = {
  categories: MenuCategory[];
};

export default function ProductCategories({ categories }: ProductCategoriesProps) {
  return (
    <section className="section-padding relative">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeInUp} className="text-sm font-semibold text-accent-400">
            دسته‌بندی محصولات
          </motion.span>
          <motion.h2 variants={fadeInUp} className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            محصولات ما، با برندهای معتبر جهانی
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-balance leading-7 text-foreground/70">
            تمامی محصولات به‌صورت نو و دست‌دوم عرضه می‌شوند؛ به‌جز قطعات یدکی که فقط به‌صورت نو ارائه می‌شود.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.12)}
          className="mt-14 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={fadeInUp} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Link
                href={`/products/${category.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-transparent bg-foreground/[0.03] p-7 transition-all duration-300 hover:border-accent-500/40 hover:shadow-xl hover:shadow-black/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-accent-500/20 [&_svg]:size-6">
                  {CATEGORY_ICONS[category.icon ?? "box"]}
                </div>
                <h3 className="mt-5 text-lg font-bold">{category.name}</h3>
                {category.children.length > 0 && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/60">
                    {category.children.map((c) => c.name).join("، ")}
                  </p>
                )}
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-accent-400">
                  مشاهده محصولات
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `src/app/products/page.tsx`**

- Remove `import { getProductCategories } from "@/lib/site-content";`, add `import { getMenuTaxonomy } from "@/lib/menu-taxonomy";`
- `const categories = await getProductCategories();` → `const { categories } = await getMenuTaxonomy();`
- `<ProductCategories categories={categories} />` stays (now `MenuCategory[]`).
- Keep the hero, `ThemedGridBackdrop`, the chunk-1 "مشاهده‌ی همه‌ی محصولات" CTA to `/products/all`, and `<AuxiliaryServices />`.

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Manual check**

`/products` → showcase grid renders the 5 DB categories; each card navigates to `/products/[slug]`; the "مشاهده‌ی همه‌ی محصولات" CTA still goes to `/products/all`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProductCategories.tsx src/app/products/page.tsx
git commit -m "$(cat <<'EOF'
feat(catalog): render /products showcase from DB categories, link cards to catalog

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Remove the JSON product-category system

**Files:**
- Modify: `src/lib/site-content.ts`
- Modify: `src/lib/site-content-defaults.ts`
- Modify: `src/components/admin/SiteContentForm.tsx`
- Modify: `src/app/api/admin/site-content/route.ts`
- Modify: `src/app/account/admin/content/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no `getProductCategories` / `ProductCategoryContent` / `DEFAULT_PRODUCT_CATEGORIES` symbols anywhere; `SiteContentForm` edits hero slides only; `POST /api/admin/site-content` accepts `{ heroSlides }` only.

- [ ] **Step 1: `src/lib/site-content.ts`**

Delete: the `DEFAULT_PRODUCT_CATEGORIES` and `type ProductCategoryContent` items from the `import { … } from "@/lib/site-content-defaults"` block; `export { DEFAULT_HERO_SLIDES, DEFAULT_PRODUCT_CATEGORIES, DEFAULT_FOOTER_CONTACT };` → drop `DEFAULT_PRODUCT_CATEGORIES`; `export type { HeroSlideContent, ProductCategoryContent, FooterContactContent };` → drop `ProductCategoryContent`; `const PRODUCT_CATEGORIES_KEY = "products.categories";`; the entire `getProductCategories` function.

- [ ] **Step 2: `src/lib/site-content-defaults.ts`**

Delete the `ProductCategoryContent` type and the `DEFAULT_PRODUCT_CATEGORIES` array (and, if now unused in this file, the `import type { CategoryIconKey }` line — check first). Keep `HeroSlideContent`, `FooterContactContent`, `DEFAULT_HERO_SLIDES`, `DEFAULT_FOOTER_CONTACT`, and the module comment.

- [ ] **Step 3: `src/components/admin/SiteContentForm.tsx`**

- Import: drop `ProductCategoryContent` (keep `HeroSlideContent`); drop `import type { CategoryIconKey }` and `import IconPicker from "@/components/admin/IconPicker";` (both only used by the category half — verify with grep).
- Delete: `CONDITION_OPTIONS`, `emptyCategory`, the `initialCategories` prop (type + destructure), `categories` state, `updateCategory`, `toggleCondition`, and the `"category"` branch of `deleteTarget` / `confirmDelete`.
- `handleSubmit` body: `body: JSON.stringify({ heroSlides, productCategories: categories })` → `body: JSON.stringify({ heroSlides })`.
- JSX: delete the entire product-categories `<section>` (the block starting near the "دسته‌بندی محصولات" heading / the `setCategories((prev) => [...prev, emptyCategory()])` add button through its closing tag, including the `categories.map(...)` render and the `categories.length === 0` empty state). Keep the hero-slides section and the shared `ConfirmDialog` (retarget it to slides only).
- `SiteContentFormProps` becomes `{ initialHeroSlides: HeroSlideContent[] }`.

- [ ] **Step 4: `src/app/api/admin/site-content/route.ts`**

- Import: `import { SITE_CONTENT_TAG, type HeroSlideContent, type ProductCategoryContent } from "@/lib/site-content";` → drop `type ProductCategoryContent`. Drop `import { CATEGORY_ICON_KEYS } from "@/lib/category-icons";` if now unused. Keep `revalidatePath, revalidateTag`.
- Delete: `CONDITION_VALUES`, `cleanProductCategory`.
- POST: `if (!body || !Array.isArray(body.heroSlides) || !Array.isArray(body.productCategories))` → `if (!body || !Array.isArray(body.heroSlides))`. Delete the `productCategories` mapping. `$transaction` array → a single `prisma.siteContent.upsert` for `hero.slides` (no need for `$transaction` with one op, but keeping it is harmless — either is fine). Delete `revalidatePath("/products");` (keep `revalidateTag(SITE_CONTENT_TAG)` and `revalidatePath("/")`).

- [ ] **Step 5: `src/app/account/admin/content/page.tsx`**

- Drop `getProductCategories` from the `@/lib/site-content` import and from the `Promise.all`.
- `<SiteContentForm initialHeroSlides={heroSlides} initialCategories={categories} />` → `<SiteContentForm initialHeroSlides={heroSlides} />`.
- Section copy: `اسلایدر صفحه اصلی و دسته‌بندی محصولات را می‌توانید ویرایش، اضافه یا حذف کنید.` → `اسلایدر صفحه اصلی را می‌توانید ویرایش، اضافه یا حذف کنید.`

- [ ] **Step 6: Sweep for stragglers**

Run: `grep -rn "ProductCategoryContent\|getProductCategories\|DEFAULT_PRODUCT_CATEGORIES\|products\.categories\|PRODUCT_CATEGORIES_KEY" src/`
Expected: **no matches**. Fix any that remain (e.g. an unused import in `Hero`/`ThemedProse`).

- [ ] **Step 7: Typecheck + lint + build**

Run: `pkill -f "next dev" 2>/dev/null; npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean. Then `rm -rf .next && (npm run dev &)`.

- [ ] **Step 8: Manual check — hero editor still works**

`/account/admin/content` as ADMIN: only the hero-slider section + footer-contact section render (no product-categories block). Add a hero slide, edit a field, Save → success toast; reload → the change persisted. The `/` homepage still renders its hero.

- [ ] **Step 9: Commit**

```bash
git add src/lib/site-content.ts src/lib/site-content-defaults.ts src/components/admin/SiteContentForm.tsx src/app/api/admin/site-content/route.ts src/app/account/admin/content/page.tsx
git commit -m "$(cat <<'EOF'
refactor(catalog): remove the JSON products.categories system and its editor

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `revalidateTag("product-taxonomy")` on category + brand admin writes

**Files:**
- Modify: `src/app/api/admin/products/categories/route.ts`
- Modify: `src/app/api/admin/products/categories/[id]/route.ts`
- Modify: `src/app/api/admin/products/brands/route.ts`
- Modify: `src/app/api/admin/products/brands/[id]/route.ts`

**Interfaces:**
- Consumes: `PRODUCT_TAXONOMY_TAG` from `@/lib/menu-taxonomy` (value `"product-taxonomy"`).
- Produces: menu cache is busted whenever an admin adds/edits/deletes a category or brand.

- [ ] **Step 1: Each of the four files**

Add to the existing `import { revalidatePath } from "next/cache";` → `import { revalidatePath, revalidateTag } from "next/cache";` (these files already import `revalidatePath` from the chunk-1 fix wave). Add `import { PRODUCT_TAXONOMY_TAG } from "@/lib/menu-taxonomy";`. On every success path that already calls `revalidatePath("/products/all")`, add on the next line `revalidateTag(PRODUCT_TAXONOMY_TAG);`. Handlers: `categories/route.ts` POST; `categories/[id]/route.ts` PATCH + DELETE; `brands/route.ts` POST; `brands/[id]/route.ts` PATCH + DELETE. Do **not** add to 401/400/404 paths.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 3: Manual check**

As ADMIN, add a new top-level category at `/account/admin/products/categories`. Within a second, reload any public page — the new category appears in the mega-menu (the `revalidateTag` dropped the 5-minute cache).

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/admin/products/categories/route.ts" "src/app/api/admin/products/categories/[id]/route.ts" "src/app/api/admin/products/brands/route.ts" "src/app/api/admin/products/brands/[id]/route.ts"
git commit -m "$(cat <<'EOF'
feat(catalog): bust the menu taxonomy cache on category/brand admin writes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Full verification pass

**Files:** none (verification only; any fix gets its own follow-up commit).

- [ ] **Step 1: Static checks**

Run: `pkill -f "next dev" 2>/dev/null; npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass; `build` shows `/products/[categorySlug]` and `/products/all` as dynamic routes and no reference errors. Then `rm -rf .next && (npm run dev &)`.

- [ ] **Step 2: Seed + reset check**

Run: `npm run db:seed:catalog` (idempotent — safe even if run before).

- [ ] **Step 3: Browser E2E (per `.claude/CLAUDE.md` QA rule)** — use `playwright` or `chrome-devtools-mcp`:
- Mega-menu (desktop): rail category → `/products/[slug]`; **click a subcategory in the panel** → `/products/[slug]?sub=[childSlug]`, grid narrows to that subcategory, breadcrumb shows all three levels; click a brand → `?brand=` narrows to that brand.
- Category page filters: check 2 subcategories (union), check a brand, toggle «فقط کالاهای موجود», drag the price slider — each updates the URL, resets `page`, and the grid + count react; «پاک‌کردن» clears them.
- Sort: each of جدیدترین / ارزان‌ترین / گران‌ترین / نام reorders correctly (priced-asc/desc put null-price last).
- Pagination: on `/products/all` add enough seed products to exceed 24 if needed (or temporarily lower `CATALOG_PAGE_SIZE` mentally and confirm the component renders when `pageCount > 1`); numbered links preserve filters and swap `page`.
- Shareability: copy a filtered category URL → new tab / hard refresh → identical grid.
- `/products/does-not-exist` → 404; `/products/diesel-generator-portable` (subcategory slug) → 404; `/products/diesel-generator?sub=bogus` → no crash, no filter.
- `/products` showcase cards → `/products/[slug]`; `/account/admin/content` hero editing still saves.
- Mobile 375: filter panel collapses to a «فیلترها» disclosure; grid is 2-col; menu drawer accordion subcategory + brand links work; no horizontal scroll; tap targets ≥ 44 px.

- [ ] **Step 4: Responsive screenshots** at 375 / 768 / 1920 of `/products/all`, `/products/diesel-generator`, and `/products/diesel-generator?sub=diesel-generator-portable&brand=caterpillar`. Save to `.superpowers/sdd/2026-09-11-product-catalog-filtering/screenshots/`.

- [ ] **Step 5: Lighthouse** on `http://localhost:3000/products/diesel-generator` (desktop preset, a11y + SEO + best-practices; treat dev-mode perf as non-representative). Accessibility & SEO ≥ 0.9.

- [ ] **Step 6: Report** — findings prioritized بحرانی / متوسط / جزئی with file:line. Do NOT fix without user confirmation (project rule).

---

## Self-Review

**1. Spec coverage**

| Spec section | Task |
|---|---|
| §3 seed (6 brands, 5 cats × subs, ~18 products, 1 inactive) | Task 1 |
| §4.1 `paramList` | Task 2 |
| §4.2 `buildCatalogQuery` (scope, sub, brand, stock, price, sort, page rules) | Task 2 |
| §5 `CatalogView` (facet derivation, brand facet ignores brand/price filter, price bounds, product query, layout, responsive) | Task 5 (+ grid layout in Task 3) |
| §5 `Breadcrumb` | Task 3 |
| §5 `CatalogFilterPanel` (multi checkboxes, in-stock, conditional price slider, reset page, clear button, mobile disclosure) | Task 4 |
| §5 `CatalogSortSelect` (4 options) | Task 4 |
| §5 `ProductGrid` / `ProductCard` (image+fallback, name, brand, pill, price-or-CTA, not a link) | Task 3 |
| §5 `CatalogPagination` (windowed, hidden when ≤1, Persian digits) | Task 3 |
| §6 `/products/[categorySlug]` (force-dynamic, 404 unknown + 404 subcategory, generateMetadata) | Task 6 |
| §6 `/products/all` rewrite | Task 6 |
| §7.1 `getMenuTaxonomy` (cached, tag, per-category brands, DB-error fallback) | Task 7 |
| §7.2 mega-menu + accordion rewrite (keep animation, new links) | Task 7 |
| §7.3 layout + header-2 + `ProductCategories` + `/products` page | Task 7 (layout/header) + Task 8 (showcase/page) |
| §7.4 JSON system removal (5 files, hero editor intact, grep sweep) | Task 9 |
| §7.5 `revalidateTag("product-taxonomy")` on 4 admin route files | Task 10 |
| §8 URL param schema | Task 2 (parse) + Task 4 (write) |
| §9 verification (tsc/lint/build, seed idempotency, browser E2E incl. menu→subcategory, responsive, Lighthouse) | Task 11 (+ per-task manual checks in 6/7/8/9/10) |
| §10 out of scope | not planned — correct |

No gaps.

**2. Placeholder scan**

No "TBD"/"handle edge cases"/"similar to Task N". Every code step is full file content or an exact located edit. Task 5 Step 1 flags a known cleanup (the `validBrandSlugs`/`brandIdBySlug` duplication) with the exact resolution in Step 2 rather than leaving it vague. Task 2/5 give concrete fallbacks for the two Prisma-feature risks (`price.nulls`, `orderBy` with `distinct`).

**3. Type consistency**

- `MenuCategory` / `MenuBrand` / `MenuTaxonomy` — defined in Task 7 Step 1; consumed with identical field names by `ProductsMegaMenu` (Task 7 Step 2), `MobileProductsAccordion` (Task 7 Step 3), `header-2` (Step 4), `layout` (Step 5, uses `menuTaxonomy.categories`), `ProductCategories` (Task 8). `icon: CategoryIconKey | null` → every consumer renders `CATEGORY_ICONS[category.icon ?? "box"]`. Consistent.
- `getMenuTaxonomy` returns `{ categories }` — layout destructures `{ categories }` (Task 7 Step 5 var name `menuTaxonomy`, then `.categories`), `/products/page.tsx` destructures `const { categories }` (Task 8). Consistent.
- `PRODUCT_TAXONOMY_TAG` — exported from `menu-taxonomy.ts` (Task 7), imported in Task 10. Same literal `"product-taxonomy"` as the `unstable_cache` `tags`. Consistent.
- `CatalogProduct = Prisma.ProductGetPayload<{ include: { brand: true } }>` — defined in `ProductCard.tsx` (Task 3), imported by `ProductGrid` (Task 3) and `CatalogView` (Task 5); `CatalogView`'s `findMany({ include: { brand: true } })` matches. Consistent.
- `buildCatalogQuery` input field names (`categoryId`, `childCategoryIds`, `validSubSlugs`, `validBrandSlugs`) — defined Task 2; `CatalogView` (Task 5) passes exactly these (with `brandIdBySlug` as `validBrandSlugs` after the noted cleanup). Consistent.
- `FacetOption = { label, slug }` — defined in `CatalogFilterPanel.tsx` (Task 4), imported by `CatalogView` (Task 5). Consistent.
- `Crumb = { label, href? }` — defined in `Breadcrumb.tsx` (Task 3), imported by `CatalogView` (Task 5). Consistent.
- `CatalogPagination` prop `makeHref: (page: number) => string` — Task 3 definition, Task 5 passes a matching closure. Consistent.
- `Header` prop rename `productCategories` → `menuCategories` — Task 7 changes the definition AND both call sites (`layout.tsx`). No other caller of `<Header>` exists (grep in Task 7). Consistent.

No inconsistencies found.
