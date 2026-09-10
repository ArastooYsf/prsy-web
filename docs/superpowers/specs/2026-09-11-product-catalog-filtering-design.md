# Product Catalog — Category Pages, Faceted Filtering, DB-driven Menu

**Date:** 2026-09-11
**Status:** Approved (design), pending implementation plan
**Builds on:** `docs/superpowers/specs/2026-09-10-product-catalog-design.md` (chunk 1 — models, admin panel, `/products/all` placeholder). All of chunk 1 is merged to `main`.

## 1. Goal

A Digikala-style public catalog: a dynamic `/products/[categorySlug]` route with a server-rendered product grid and a URL-state faceted filter panel (subcategory, brand, availability, price), sort, and pagination. `/products/all` becomes the same view with no category scope. The header mega-menu and mobile accordion switch from the admin-JSON category blob to the real DB taxonomy so their links land on these pages; the JSON category system is removed.

## 2. Context (current state, verified)

- **Two disjoint category systems today:**
  - **DB** (`ProductCategory` two-level tree, `Brand`, `Product`) — drives `/account/admin/products/*`. Chunk 1. Real slugs, FKs, `icon` ∈ `CATEGORY_ICON_KEYS`.
  - **JSON** (`SiteContent` key `products.categories`, shape `ProductCategoryContent { id, title, description(html), iconKey, conditions[], brands: string[], image? }` in `src/lib/site-content-defaults.ts`) — drives the mega-menu (`ProductsMegaMenu.tsx`), the mobile accordion (`MobileProductsAccordion.tsx`), and the `/products` showcase (`ProductCategories.tsx`). Edited in `/account/admin/content` via `SiteContentForm.tsx` (which **also** edits hero slides) → `POST /api/admin/site-content`. Links target `/products#<id>` anchors. `getProductCategories()` in `src/lib/site-content.ts` reads it (cached, tag `site-content`).
- `src/app/layout.tsx` fetches `getProductCategories()` and passes `productCategories` → `Header` (`src/components/ui/header-2.tsx`) → `ProductsMegaMenu` / `MobileProductsAccordion`.
- `/products` (`src/app/products/page.tsx`) = hero + `<ProductCategories categories={…}/>` + `<AuxiliaryServices/>` + the chunk-1 "مشاهده‌ی همه‌ی محصولات" CTA → `/products/all`.
- `/products/all` (`src/app/products/all/page.tsx`) = chunk-1 placeholder (hero header + a `prisma.product.count` sentence).
- `src/lib/list-query.ts` — `param`, `sortParams`, `filterQueryString`, `ListSearchParams`, date helpers. **No multi-value helper.**
- Admin filter UX pattern (`ListFilterBar.tsx` + `SortableHeader.tsx`): client components that `router.push(pathname?params, { scroll: false })`; server pages read params and build Prisma `where`/`orderBy`. Single-value `?key=`.
- `Product` fields: `id, name, slug, description(Text), images(Json string[]), specs(Json {label,value}[]), categoryId?, brandId?, availability(IN_STOCK|OUT_OF_STOCK|CALL), showPrice(bool), price(Int?), isActive(bool), deletedAt?, createdAt, updatedAt`.
- `PRODUCT_AVAILABILITY` labels in `src/lib/status-labels.ts`. `getMediaUrl` in `src/lib/media.ts`. `formatNumber` / `toPersianDigits` in `src/lib/format-number.ts`. `EmptyState` in `src/components/ui/EmptyState.tsx`. `ThemedGridBackdrop` in `src/components/ui/ThemedGridBackdrop.tsx`.
- No test framework — verification is `tsc --noEmit` + `npm run lint` + `npm run build` + manual browser testing.
- **Dev-server gotcha:** running `npm run build` while `next dev` is up corrupts the dev server's `.next` (chunk 404s). Any task that runs `build` must `pkill -f "next dev"` first and restart it after.

## 3. Seed data (`prisma/seed-catalog.ts`, script `db:seed:catalog`)

Idempotent (`upsert` by slug). Without it a DB-driven menu is empty. Also serves as filter test data.

- **6 brands** (`slug` = kebab of the latin name): Caterpillar `caterpillar`, Cummins `cummins`, Perkins `perkins`, Volvo `volvo`, Weichai `weichai`, Stamford `stamford`. `name` in Persian is fine («کاترپیلار» …) but keep `slug` latin.
- **5 top categories** (icon from `CATEGORY_ICON_KEYS`), each with 2–3 subcategories:
  - `diesel-generator` دیزل ژنراتور (`generator`) → `diesel-generator-industrial`, `diesel-generator-marine`, `diesel-generator-portable`
  - `power-engine` موتور برق (`engine`) → `power-engine-gasoline`, `power-engine-diesel`
  - `spare-parts` قطعات یدکی (`parts`) → `spare-parts-engine`, `spare-parts-alternator`, `spare-parts-control`
  - `generator-engine` موتور ژنراتور (`generator-engine`) → `generator-engine-cat`, `generator-engine-cummins`
  - `alternator` دینام / آلترناتور (`alternator`) → `alternator-brushless`, `alternator-brushed`
  - `order` field ascending in listed order.
- **~18 products** spread across those subcategories and brands: a mix of `availability` (≈10 `IN_STOCK`, 4 `OUT_OF_STOCK`, 4 `CALL`), `showPrice` true for ≈6 (varied `price` so a range slider is meaningful), the rest `showPrice: false`. `isActive: true` for all but 1 (kept inactive to prove it never appears publicly). `images: []` is acceptable (cards show the `ImageOff` fallback); include 1–2 real `uploads/…` paths if any exist. `specs`: 2–3 rows each.
- The script must not delete anything it didn't create; safe to re-run.

## 4. Query layer

### 4.1 `src/lib/list-query.ts` — add

```ts
/** Multi-value query param: "a,b,c" -> ["a","b","c"] (trimmed, non-empty, de-duped). */
export function paramList(searchParams: ListSearchParams, key: string): string[] {
  const raw = param(searchParams, key);
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}
```

### 4.2 `src/lib/catalog-query.ts` — new

```ts
export const CATALOG_PAGE_SIZE = 24;
export const CATALOG_SORTS = ["newest", "price-asc", "price-desc", "name"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export type CatalogQueryInput = {
  searchParams: ListSearchParams;
  categoryId?: string;          // the resolved top-level category, if on /products/[slug]
  childCategoryIds: string[];   // ids of that category's subcategories (empty on /products/all)
  validSubSlugs: Map<string, string>;   // subSlug -> id, for translating ?sub=
  validBrandSlugs: Map<string, string>; // brandSlug -> id, for translating ?brand=
};

export type CatalogQuery = {
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput;
  page: number;      // 1-based, clamped >= 1
  skip: number;
  take: number;      // CATALOG_PAGE_SIZE
  sort: CatalogSort;
  activePriceRange: { min: number; max: number } | null; // echo of applied ?priceMin/priceMax
};

export function buildCatalogQuery(input: CatalogQueryInput): CatalogQuery;
```

Rules:
- **base** `where`: `{ isActive: true, deletedAt: null }`.
- **category scope**: if `categoryId` present → `categoryId: { in: [categoryId, ...childCategoryIds] }`.
- **`?sub=`**: `paramList` → translate through `validSubSlugs`; unknown slugs dropped. If any resolve → replace the category-scope clause with `categoryId: { in: <resolvedSubIds> }` (narrows within the category). On `/products/all` `?sub=` is interpreted against **top-level** category slugs (the panel there lists top categories) — the page passes those as `validSubSlugs`.
- **`?brand=`**: `paramList` → translate through `validBrandSlugs`; unknown dropped; if any → `brandId: { in: <ids> }`.
- **`?stock=1`**: → `availability: "IN_STOCK"`. Any other value = ignored.
- **`?priceMin` / `?priceMax`**: parsed as non-negative ints; if either present → add `showPrice: true, price: { gte?: min, lte?: max }` and set `activePriceRange`. (Filtering by price necessarily excludes `showPrice:false` products — intended.)
- **sort** (`?sort`, default `newest`): `newest`→`{ createdAt: "desc" }`, `name`→`{ name: "asc" }`, `price-asc`→`{ price: { sort: "asc", nulls: "last" } }`, `price-desc`→`{ price: { sort: "desc", nulls: "last" } }`. Unknown → `newest`.
- **page** (`?page`): int ≥ 1, default 1; `skip = (page-1)*CATALOG_PAGE_SIZE`.

No Prisma client import at module top that would break client bundles — this file is server-only (imported by server components only). Types via `import type { Prisma }`.

## 5. Shared catalog view + components (`src/components/products/`)

### `CatalogView.tsx` (server component)

Props:
```ts
type CatalogViewProps = {
  category?: {                      // absent on /products/all
    id: string; name: string; slug: string;
    children: { id: string; name: string; slug: string }[];
  };
  searchParams: ListSearchParams;
  basePath: string;                 // "/products/all" or `/products/${category.slug}`
};
```
Responsibilities:
1. Resolve facet inputs: the subcategory list (either `category.children`, or — on `/products/all` — all top-level `ProductCategory` rows), and the brand list = brands referenced by ≥1 product **within the current category scope, ignoring the brand/price filters** (so unchecking a brand doesn't make it vanish). Compute via a `groupBy`/`findMany distinct` on `Product` filtered to `{ isActive, deletedAt:null, <category scope> }`.
2. Compute the price-facet bounds: `min`/`max` `price` among `{ <scope>, showPrice: true }` products (ignoring `?priceMin/priceMax`). Panel renders the slider only if that set is non-empty.
3. `buildCatalogQuery(...)`, then `Promise.all([ prisma.product.findMany({ where, orderBy, skip, take, include:{ brand:true, category:true } }), prisma.product.count({ where }) ])`.
4. Render: `<Breadcrumb/>`, then a two-column layout (RTL: filter panel on the right, content on the left) — `<CatalogFilterPanel/>` + a content column of (`<div>` result count + `<CatalogSortSelect/>`), `<ProductGrid/>` (or `<EmptyState/>` when count 0), `<CatalogPagination/>`.
5. Layout is responsive: at `< lg` the filter panel collapses into a `<details>`/disclosure «فیلترها» above the grid; grid is 2-col (`sm`), 3-col (`md`), 4-col (`xl`).

### `Breadcrumb.tsx`

`همه‌ی محصولات` (→ `/products/all`) › `<category.name>` (→ `/products/[slug]`, omitted on `/products/all`) › `<sub name>` (only when exactly one `?sub=` resolves). Persian, `aria-label="مسیر ناوبری"`, current crumb `aria-current="page"`.

### `CatalogFilterPanel.tsx` (client)

- Reads `useSearchParams()`. Sections: **زیردسته‌ها** (or **دسته‌بندی** on `/products/all`) — checkbox list, multi; **برند** — checkbox list, multi, only the brands passed in; **فقط کالاهای موجود** — single checkbox → `stock=1`; **بازه‌ی قیمت** — dual-handle range (`min`/`max` from props) writing `priceMin`/`priceMax`, only rendered when props say a priced set exists.
- Any change: rebuild the query string (comma-join multi values, drop empty keys), **reset `page`**, `router.push(\`${basePath}?${qs}\`, { scroll: false })`. Debounce the price slider (~300 ms) like `ListFilterBar` debounces search.
- A «پاک‌کردن فیلترها» button when any facet is active → `router.push(basePath, { scroll:false })`.
- All inputs keyboard-reachable, labelled; checkbox rows ≥ 40 px tall; the mobile disclosure toggle ≥ 44 px.

### `CatalogSortSelect.tsx` (client)

`<select>` with the 4 options (جدیدترین / ارزان‌ترین / گران‌ترین / نام). `onChange` → set `?sort=`, reset `page`, `router.push(..., { scroll:false })`. `<label>` «مرتب‌سازی».

### `ProductGrid.tsx` + `ProductCard.tsx` (server / presentational)

- Grid: `grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4`.
- Card: image box (`aspect-square`, `next/image` via `getMediaUrl(images[0])`, `ImageOff` fallback), name (2-line clamp), brand name chip (if any), availability pill (`PRODUCT_AVAILABILITY`), then price row:
  - `showPrice && price != null` → `<span>{formatNumber(price)} تومان</span>`
  - else → `<Link href="/contact" class="…">درخواست قیمت</Link>`
- The card is **not** a link (no product detail page this chunk). Whole card has a subtle hover.

### `CatalogPagination.tsx` (server)

Given `page`, `pageCount = Math.ceil(count / CATALOG_PAGE_SIZE)`, and `basePath` + current params: render prev/next + a windowed set of numbered `<Link>`s (Persian digits via `toPersianDigits`), each preserving all current params with `page` swapped. Hidden entirely when `pageCount <= 1`. `aria-label="صفحه‌بندی"`, current page `aria-current="page"`.

## 6. Routes

### `src/app/products/[categorySlug]/page.tsx`

- `export const dynamic = "force-dynamic";`
- Load `prisma.productCategory.findUnique({ where: { slug: params.categorySlug }, include: { children: { orderBy: [{ order: "asc" }, { name: "asc" }] } } })`. If missing **or** `category.parentId != null` (subcategories are not their own pages — they're a `?sub=` filter) → `notFound()`.
- `generateMetadata`: `title` = category name, `description` a short Persian line naming the category.
- Render `<CatalogView category={{…}} basePath={\`/products/${category.slug}\`} searchParams={searchParams} />`.

### `src/app/products/all/page.tsx` (rewrite)

- Keep `export const metadata` (title «همه‌ی محصولات») and `dynamic = "force-dynamic"`.
- Replace the placeholder body with `<CatalogView basePath="/products/all" searchParams={searchParams} />` (no `category`). The panel's first facet lists all top-level categories.

## 7. DB-driven menu + JSON removal

### 7.1 `src/lib/menu-taxonomy.ts` — new

```ts
export type MenuBrand = { id: string; name: string; slug: string };
export type MenuCategory = {
  id: string; name: string; slug: string; icon: CategoryIconKey | null;
  children: { id: string; name: string; slug: string }[];
  brands: MenuBrand[];   // brands present among active products in this top category's subtree
};
export type MenuTaxonomy = { categories: MenuCategory[] };

export const getMenuTaxonomy: () => Promise<MenuTaxonomy>;
```
`unstable_cache`d, tags `["product-taxonomy"]`, `revalidate: 300`. Reads top-level `ProductCategory` (`parentId: null`) ordered `[{order},{name}]` with `children` similarly ordered; then one `prisma.product.findMany({ where: { isActive: true, deletedAt: null, brandId: { not: null } }, select: { categoryId: true, brand: { select: { id, name, slug } } }, distinct: ["categoryId", "brandId"] })` to build, per top category, the set of brands appearing on its own or its children's products (`brands` sorted by `Brand.order` then name via a preceding brand fetch, or by name). On DB error returns `{ categories: [] }` (menu falls back to a plain "محصولات" link → `/products/all`, as it already does for the empty case).

### 7.2 `ProductsMegaMenu.tsx` / `MobileProductsAccordion.tsx` — rewrite data, keep interaction

- Prop becomes `categories: MenuCategory[]` (each carrying its own `children` and `brands`). Keep every hover/animation/close-delay/focus detail unchanged.
- Empty case (`categories.length === 0`) unchanged: plain `<Link href="/products/all">محصولات</Link>`.
- Rail item → `/products/${cat.slug}`; icon from `CATEGORY_ICONS[cat.icon ?? "box"]`.
- Panel (desktop) / second level (mobile): show that category's **subcategories** as links `/products/${cat.slug}?sub=${child.slug}` under a «زیردسته‌ها» heading, then its **brands** as links `/products/${cat.slug}?brand=${brand.slug}` under «برندها». "مشاهده همه" → `/products/${cat.slug}`.
- If a category has no children, show only the brands block (and vice-versa); if it has neither, the panel shows just the title + "مشاهده همه".

### 7.3 Wiring

- `src/app/layout.tsx`: replace `getProductCategories()` with `getMenuTaxonomy()`; pass `menuTaxonomy` down.
- `src/components/ui/header-2.tsx`: rename prop `productCategories` → `menuTaxonomy`, retype, thread to both menu components.
- `src/components/ProductCategories.tsx`: change props to `categories: MenuCategory[]` (top-level DB categories); each card links to `/products/${slug}`; icon via `CATEGORY_ICONS`. Drop the `conditions` badge logic and the `DEFAULT_PRODUCT_CATEGORIES` fallback (render `<EmptyState/>` if none — should not happen after seed). `AuxiliaryServices` untouched.
- `src/app/products/page.tsx`: fetch top-level DB categories (via `getMenuTaxonomy()` or a direct `prisma` call) and pass to `ProductCategories`; keep the `/products/all` CTA; hero copy unchanged.

### 7.4 Remove the JSON category system

Delete, and fix every resulting reference (`grep` for each symbol first):
- `src/lib/site-content.ts`: `getProductCategories`, `PRODUCT_CATEGORIES_KEY`, and its `export`s / the `DEFAULT_PRODUCT_CATEGORIES` re-export.
- `src/lib/site-content-defaults.ts`: `ProductCategoryContent` type, `DEFAULT_PRODUCT_CATEGORIES` and its category data (leave `HeroSlideContent`, `FooterContactContent`, their defaults, and the `conditions` type if unused elsewhere — check).
- `src/components/admin/SiteContentForm.tsx`: remove the product-categories half entirely — `emptyCategory`, `updateCategory`, `toggleCondition`, category state, the category render block, the `IconPicker` for categories, and `productCategories` from the POST body. **Hero-slides editing must keep working** and the POST body then sends only `{ heroSlides }`.
- `src/app/api/admin/site-content/route.ts`: drop `cleanProductCategory`, the `products.categories` upsert in the `$transaction`, the `Array.isArray(body.productCategories)` check, and `revalidatePath("/products")` (hero only affects `/`). Keep the `heroSlides` path and `CATEGORY_ICON_KEYS` import only if still used.
- `src/app/account/admin/content/page.tsx`: drop `getProductCategories()` + `initialCategories`; update the section copy to mention only the hero slider.
- Any other hit for `ProductCategoryContent` / `getProductCategories` / `DEFAULT_PRODUCT_CATEGORIES` (e.g. `Hero`, `ThemedProse` per import comments) — repoint or remove.

### 7.5 Cache invalidation on taxonomy edits

Add `revalidateTag("product-taxonomy")` to the chunk-1 category + brand admin handlers (they currently only `revalidatePath("/products/all")`):
- `src/app/api/admin/products/categories/route.ts` (POST), `categories/[id]/route.ts` (PATCH, DELETE)
- `src/app/api/admin/products/brands/route.ts` (POST), `brands/[id]/route.ts` (PATCH, DELETE)
Product writes do **not** touch the menu, so no change to the product handlers beyond what chunk 1 shipped.

## 8. URL parameter schema (all on the query string, shareable, refresh-safe)

| Param | Form | Meaning |
|---|---|---|
| `sub` | `a,b,c` | subcategory slugs (top-level cat slugs on `/products/all`) |
| `brand` | `a,b` | brand slugs |
| `stock` | `1` | only `IN_STOCK` |
| `priceMin` / `priceMax` | int | Toman bounds (implies `showPrice:true`) |
| `sort` | `newest\|price-asc\|price-desc\|name` | default `newest` |
| `page` | int ≥ 1 | default 1 |

Unknown values are ignored, never 404. Changing any facet resets `page` to 1.

## 9. Testing / verification

- `tsc --noEmit`, `npm run lint`, `npm run build` (kill/restart `next dev` around `build`).
- `npm run db:seed:catalog`, then re-run — no duplicates, no error.
- Browser (per project QA rule), on a fresh `next dev`:
  - Mega-menu: rail categories → `/products/[slug]`; clicking a **subcategory** in the panel → `/products/[slug]?sub=[childSlug]` and the grid shows only that subcategory; clicking a brand → `?brand=`.
  - Category page: subcategory checkboxes (multi), brand checkboxes (multi), «فقط موجود», price slider (present only when priced products exist), each sort option, pagination (seed enough products to exceed 24 in `/products/all`), breadcrumb correctness, «پاک‌کردن فیلترها».
  - Copy a filtered URL into a new tab / hard refresh → identical results.
  - Unknown `/products/does-not-exist` → 404; `/products/[valid]?sub=garbage` → no crash, no filter effect.
  - `/products` showcase cards link to `/products/[slug]`; `/products/all` still reachable from the CTA.
  - `/account/admin/content` — hero slide add/edit/save still works; no product-category section remains.
  - Responsive 375 / 768 / 1920 (filter panel collapses on mobile, grid reflows, no horizontal scroll, tap targets ≥ 44 px); Lighthouse on a category page (a11y + SEO ≥ 0.9; treat dev-mode perf as non-representative).

## 10. Out of scope

Product detail page, per-facet result counts, "پرفروش‌ترین" sort (no sales data), a search box on the catalog, infinite scroll, saved filters, category `isActive`/visibility toggle.
