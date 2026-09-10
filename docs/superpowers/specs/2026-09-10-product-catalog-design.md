# Product Catalog — Data Model + Admin Panel + Public Route Stub

**Date:** 2026-09-10
**Status:** Approved (design), pending implementation plan
**Scope of this chunk:** Prisma data model, admin CRUD panel (products + categories + brands), and a placeholder `/products/all` public route. The public product grid and Digikala-style facet filters are a **separate later chunk** and are out of scope here.

---

## 1. Context

`/products` already exists as a marketing landing page: hero section + `ProductCategories` showcase driven by `SiteContent` JSON (`products.categories` key) + `AuxiliaryServices`. It is linked from `Footer`, `ProductsMegaMenu`, `MobileProductsAccordion`, `not-found.tsx`, and hero-slide CTAs. This chunk must **not** disturb that page beyond adding one CTA.

The project has an established admin CRUD pattern under `/account/admin/*` (blog, contracts, orders, customers):

- Server-component list page with role gate (`session.user.role !== "ADMIN"` → `redirect`).
- Desktop `<table>` + mobile card list (`md:` breakpoint split), sticky headers.
- `ListFilterBar` + `SortableHeader` + `src/lib/list-query.ts` helpers for filter/sort/query-string.
- `EmptyState` component for empty lists.
- Mutations via `/api/admin/*` route handlers (POST/PATCH/DELETE), re-checking the role, `revalidatePath` after writes.
- Delete via `ConfirmDialog` + `useToast` + `router.refresh()` (see `DeletePostButton`).
- Soft-delete convention: nullable `deletedAt` column, list queries filter `deletedAt: null` (see `Contract`, `Ticket`, `Order`).
- Forms: client components, `slugify` for auto-slug, `MediaPicker` for images, `RichTextEditor` (TipTap) for rich text, `sanitizePlainText` / `sanitizeRichText` on the server before persist.
- Media paths are stored as **relative strings** (e.g. `products/foo.jpg`) resolved through `getMediaUrl()` / `NEXT_PUBLIC_MEDIA_URL`.
- Category icons are a fixed registry: `CATEGORY_ICON_KEYS` in `src/lib/category-icons.tsx`.
- DB is MySQL; migrations via `prisma migrate dev`. **MySQL does not support Prisma scalar lists (`String[]`)** — arrays must be `Json`.

---

## 2. Data model (`prisma/schema.prisma`)

### New enum

```prisma
enum ProductAvailability {
  IN_STOCK      // موجود
  OUT_OF_STOCK  // ناموجود
  CALL          // تماس بگیرید
}
```

### Media

Product images reuse the existing `MediaPicker` admin component as-is, which
uploads under the `SITE_CONTENT` scope (identical to how blog cover images
work). No change to the `MediaScope` enum or the media upload/list subsystem
— keeps the security-sensitive scope gating untouched.

### `Brand`

| Field | Type | Notes |
|---|---|---|
| id | String @id @default(cuid()) | |
| name | String @unique | |
| slug | String @unique | from `slugify(name)`, uniqued with numeric suffix |
| logo | String? | relative media path |
| description | String? @db.Text | plain text |
| order | Int @default(0) | display order |
| createdAt / updatedAt | DateTime | |
| products | Product[] | back-relation |

`@@map("brands")`. **No soft-delete.** Hard delete blocked at API level when `products` count > 0.

### `ProductCategory`

| Field | Type | Notes |
|---|---|---|
| id | String @id @default(cuid()) | |
| name | String | |
| slug | String @unique | |
| icon | String? | one of `CATEGORY_ICON_KEYS` |
| parentId | String? | self-relation |
| parent | ProductCategory? @relation("CategoryTree", fields: [parentId], references: [id], onDelete: Restrict) | |
| children | ProductCategory[] @relation("CategoryTree") | |
| order | Int @default(0) | |
| createdAt / updatedAt | DateTime | |
| products | Product[] | |

`@@index([parentId])`, `@@map("product_categories")`. **No soft-delete.** Hard delete blocked at API level when the category has children or products. Tree depth is not constrained by the schema; the admin UI presents two levels (category → subcategory) and the parent picker only offers top-level categories (those with `parentId == null`).

### `Product`

| Field | Type | Notes |
|---|---|---|
| id | String @id @default(cuid()) | |
| name | String | |
| slug | String @unique | from `slugify(name)`, uniqued with numeric suffix |
| description | String? @db.Text | rich text, `sanitizeRichText` on save |
| images | Json @default("[]") | `string[]` of relative media paths, order = display order |
| specs | Json @default("[]") | `{ label: string, value: string }[]`, order preserved |
| categoryId | String? | |
| category | ProductCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull) | |
| brandId | String? | |
| brand | Brand? @relation(fields: [brandId], references: [id], onDelete: SetNull) | |
| availability | ProductAvailability @default(IN_STOCK) | |
| showPrice | Boolean @default(false) | |
| price | Int? | whole Toman; only meaningful/rendered when `showPrice` is true |
| isActive | Boolean @default(true) | public visibility toggle |
| deletedAt | DateTime? | soft-delete |
| createdAt / updatedAt | DateTime | |

`@@index([categoryId])`, `@@index([brandId])`, `@@index([deletedAt])`, `@@map("products")`.

### Migration

`prisma migrate dev --name add_product_catalog`. `prisma generate` is already part of `npm run build` and `postinstall`. No seed data.

### JSON payload shapes (validated in API, typed in `src/types/`)

```ts
type ProductImages = string[];                       // relative media paths
type ProductSpec   = { label: string; value: string };
type ProductSpecs  = ProductSpec[];
```

API coerces/validates: `images` → array of non-empty strings (cap length, e.g. 12); `specs` → array of `{label,value}` with both non-empty after `sanitizePlainText`, drop blank rows, cap count (e.g. 40).

---

## 3. Admin panel

All pages ADMIN-only (`SUPPORT` excluded), matching the blog admin gate.

### Routes / pages (`src/app/account/admin/products/`)

| Path | Purpose |
|---|---|
| `products/page.tsx` | Product list. Desktop table + mobile cards. `ListFilterBar` selects: category, brand, availability; text search on `name`. `SortableHeader` fields: `name`, `category`, `brand`, `availability`, `price`, `createdAt`. Query filters `deletedAt: null`. Header actions: "محصول جدید" (link to `new`), "دسته‌بندی‌ها" (link to `categories`), "برندها" (link to `brands`). `EmptyState` when no rows. |
| `products/new/page.tsx` | Renders `<ProductForm mode="create" />` with category + brand option lists fetched server-side. |
| `products/[id]/page.tsx` | Loads product (404 if missing or `deletedAt != null`), renders `<ProductForm mode="edit" product={...} />`. |
| `products/categories/page.tsx` | Renders `<CategoryManager categories={tree} />`. Server-fetches all categories ordered by `order, name`. |
| `products/brands/page.tsx` | Renders `<BrandManager brands={list} />`. Server-fetches all brands ordered by `order, name`. |

### API (`src/app/api/admin/products/`)

Each handler re-checks `session.user.role === "ADMIN"` (401 otherwise), parses JSON defensively, and returns `{ error }` Persian strings with appropriate status. After any write, `revalidatePath("/products/all")` (the only route backed by these tables in this chunk). Product writes also `revalidatePath("/products/all")`; category/brand writes likewise. `/products` is not revalidated — it reads `SiteContent`, not these tables.

| File | Methods |
|---|---|
| `route.ts` | `POST` — create product. Required: `name`. Validates slug uniqueness, images/specs shapes, `price` only kept when `showPrice`. |
| `[id]/route.ts` | `PATCH` — update (same validation, slug uniqueness excludes self). `DELETE` — soft-delete (`deletedAt = new Date()`). |
| `categories/route.ts` | `POST` — create category. Required: `name`. `parentId` must reference an existing top-level category or be null. |
| `categories/[id]/route.ts` | `PATCH` — update (guard: cannot set own id or a descendant as `parentId`; a category that has children cannot become a child). `DELETE` — 400 if `children` or `products` exist, else hard delete. |
| `brands/route.ts` | `POST` — create brand. Required: `name`. |
| `brands/[id]/route.ts` | `PATCH` — update. `DELETE` — 400 if `products` exist, else hard delete. |

Product read for list/edit pages is done directly via `prisma` in the server component (matching blog); no `GET` handlers.

### Components (`src/components/admin/`)

- **`ProductForm.tsx`** (client). Fields: name; slug (auto from name until manually edited, `dir="ltr"`); description (`RichTextEditor`); images (`MediaPicker multiple`); category `<select>` (grouped: top-level as `<optgroup>`, children as options, plus a "بدون دسته" option); brand `<select>` (plus "بدون برند"); availability `<select>` (3 options from `PRODUCT_AVAILABILITY`); `showPrice` checkbox; `price` number input shown only when `showPrice` (Toman, integer); `isActive` checkbox (default checked); specs repeater — list of `{label, value}` rows with add / remove / reorder-free (order = array order). Submits to `POST /api/admin/products` or `PATCH /api/admin/products/[id]`, toast + `router.push("/account/admin/products")` + `refresh` on success. Props include `categories` and `brands` option lists.
- **`ProductRow.tsx`** — exports `ProductCardMobile` and `ProductRowDesktop`. Columns: thumbnail (first image) + name, category, brand, availability badge, price (or "—" / "بر اساس تماس"), edit link, `DeleteProductButton`.
- **`DeleteProductButton.tsx`** — `ConfirmDialog` + `DELETE` + toast + `router.refresh()` (copy of `DeletePostButton` shape).
- **`CategoryManager.tsx`** (client). Renders the two-level tree. Inline "افزودن دسته" / "افزودن زیردسته" / edit / delete, each via `ConfirmDialog` or a small inline modal/form, calling the `categories` API. Fields per category: name, slug, icon (`<select>` over `CATEGORY_ICON_KEYS` with Persian labels), parent (only for subcategories), order.
- **`BrandManager.tsx`** (client). List of brands with inline add / edit / delete. Fields: name, slug, logo (`MediaPicker` single), description, order.

### Shared wiring

- **`src/lib/status-labels.ts`** — add:
  ```ts
  export const PRODUCT_AVAILABILITY: Record<string, { label: string; className: string }> = {
    IN_STOCK:     { label: "موجود",        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
    OUT_OF_STOCK: { label: "ناموجود",      className: "border-red-500/30 bg-red-500/10 text-red-400" },
    CALL:         { label: "تماس بگیرید",  className: "border-accent-500/30 bg-accent-500/10 text-accent-400" },
  };
  ```
- **`src/components/account/AccountSidebar.tsx`** — add to `ADMIN_LINKS`:
  ```ts
  { href: "/account/admin/products", label: "محصولات (مدیریت)", icon: Boxes, roles: ["ADMIN"] },
  ```
  (import `Boxes` from `lucide-react`; place after the blog entry or near orders.)
- Reuse `slugify`, `list-query`, `sanitize`, `MediaPicker`, `RichTextEditor`, `ConfirmDialog`, `EmptyState`, `useToast`.

---

## 4. Public route (placeholder only)

- **`src/app/products/all/page.tsx`** — server component. `export const metadata` with title `"همه‌ی محصولات"`. Renders a hero-style header (same visual language as `/products`: `ThemedGridBackdrop`, badge, `h1`, lead paragraph) and a short placeholder note that the catalog grid is coming soon. No data fetching required for this chunk (or a trivial `prisma.product.count({ where: { isActive: true, deletedAt: null } })` to show "N محصول" — optional, keep minimal).
- **`src/app/products/page.tsx`** — add a single "مشاهده‌ی همه‌ی محصولات" CTA button (link to `/products/all`) in the hero section. No other change.

The later chunk will build `ProductGrid` + filters and repoint this route at real data, then add `/products/[categorySlug]` and a product detail page.

---

## 5. Testing / verification

- `prisma migrate dev --name add_product_catalog` applies cleanly; `prisma generate` produces the new model types.
- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- Manual (dev server + browser):
  - Admin can create / edit / soft-delete a product; soft-deleted products disappear from the list.
  - Category create (top-level + subcategory), edit, delete; delete blocked with a Persian error when the category has children or products.
  - Brand create / edit / delete; delete blocked when a product references the brand.
  - `showPrice` toggles the price input; price hidden in the list when `showPrice` is false.
  - `/products` still renders with the new CTA; `/products/all` renders the placeholder.
- Responsive pass at 375 / 768 / 1920 on the admin product list (table ↔ card switch, no horizontal scroll, ≥44px tap targets) per project QA rule.
- Browser screenshots via chrome-devtools-mcp / playwright for the admin list and `/products/all`.

---

## 6. Out of scope (next chunk)

Public `ProductGrid` component, Digikala-style facet filters (category tree, brand, availability, price range, in-stock), `/products/[categorySlug]` category pages, product detail page (`/products/[categorySlug]/[slug]`), public product search, and any relevance/sort UI.
