# Product Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a product catalog data model, an admin CRUD panel for products/categories/brands, and a placeholder `/products/all` public route — without a public product grid yet.

**Architecture:** Three new Prisma models (`Product`, `ProductCategory` self-referential, `Brand`) on the existing MySQL database. Admin pages under `/account/admin/products/*` follow the project's established server-component-list + client-form + `/api/admin/*` route-handler pattern (as used by blog/contracts/orders). Product images and rich text reuse the existing `MediaPicker` / `RichTextEditor` components. The public side gets only a static placeholder page plus one CTA link.

**Tech Stack:** Next.js 14 App Router, Prisma 7 (`@prisma/adapter-mariadb`, MySQL), NextAuth, Tailwind, lucide-react, TipTap (via existing `RichTextEditor`), framer-motion (via existing shared components).

**Spec:** `docs/superpowers/specs/2026-09-10-product-catalog-design.md`

## Global Constraints

- **No test framework exists in this repo.** There is no `test` script, no jest/vitest. Verification for every task = `npx tsc --noEmit` passes, `npm run lint` passes, plus the task's explicit manual/CLI check. Do **not** add a test runner.
- **DB is MySQL.** No Prisma scalar lists (`String[]`). Arrays are `Json` columns.
- **Migrations:** `npx prisma migrate dev --name <name>`. `prisma generate` output goes to `src/generated/prisma` (already wired; `npm run build` and `postinstall` run it).
- **Prisma client import:** `import { prisma } from "@/lib/prisma"`. Types: `import type { Prisma } from "@/generated/prisma/client"`. Runtime enums: `import { ProductAvailability } from "@/generated/prisma/client"`.
- **All admin pages & API handlers are ADMIN-only** (`session.user.role !== "ADMIN"`). Pages `redirect("/account/admin")`; API handlers return `NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 })`.
- **All user-facing copy is Persian (fa-IR), RTL.** Error strings in API responses are Persian.
- **Slugs:** generate with `slugify()` from `@/lib/slugify`; url-unique with a numeric suffix via the shared `ensureUniqueSlug` helper added in Task 2.
- **Media paths** are stored as relative strings (e.g. `uploads/abc.jpg`); render through `getMediaUrl()` from `@/lib/media`. `MediaPicker` uploads under the `SITE_CONTENT` scope (unchanged).
- **Rich text** is sanitized server-side with `sanitizeRichText` from `@/lib/sanitize`; plain text with `sanitizePlainText`.
- **Commit after every task** with a conventional-commit message; include the `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer.
- **After code changes, run** `graphify update .` is desired by project CLAUDE.md but the hook currently cannot find graphify — skip if it errors; do not block on it.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/lib/unique-slug.ts` | `ensureUniqueSlug(base, exists)` — shared slug-uniqueness helper for product/category/brand. |
| `src/lib/product-json.ts` | Parse/validate the `images` and `specs` JSON payloads; shared types `ProductSpec`. |
| `src/app/api/admin/products/route.ts` | `POST` create product. |
| `src/app/api/admin/products/[id]/route.ts` | `PATCH` update, `DELETE` soft-delete product. |
| `src/app/api/admin/products/categories/route.ts` | `POST` create category. |
| `src/app/api/admin/products/categories/[id]/route.ts` | `PATCH` update, `DELETE` (guarded) category. |
| `src/app/api/admin/products/brands/route.ts` | `POST` create brand. |
| `src/app/api/admin/products/brands/[id]/route.ts` | `PATCH` update, `DELETE` (guarded) brand. |
| `src/app/account/admin/products/page.tsx` | Product list (server component). |
| `src/app/account/admin/products/ProductRow.tsx` | `ProductCardMobile` + `ProductRowDesktop`. |
| `src/app/account/admin/products/new/page.tsx` | Create-product page. |
| `src/app/account/admin/products/[id]/page.tsx` | Edit-product page. |
| `src/app/account/admin/products/categories/page.tsx` | Category manager page (server component shell). |
| `src/app/account/admin/products/brands/page.tsx` | Brand manager page (server component shell). |
| `src/components/admin/ProductForm.tsx` | Create/edit product form (client). |
| `src/components/admin/DeleteProductButton.tsx` | Soft-delete button + `ConfirmDialog` (client). |
| `src/components/admin/CategoryManager.tsx` | Category tree CRUD (client). |
| `src/components/admin/BrandManager.tsx` | Brand list CRUD (client). |
| `src/app/products/all/page.tsx` | Public placeholder "all products" page. |

**Modified:**

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `ProductAvailability` enum + `Brand`, `ProductCategory`, `Product` models. |
| `src/lib/status-labels.ts` | Add `PRODUCT_AVAILABILITY` record + `PRODUCT_AVAILABILITIES` keys array. |
| `src/components/account/AccountSidebar.tsx` | Add "محصولات (مدیریت)" link to `ADMIN_LINKS`. |
| `src/app/products/page.tsx` | Add "مشاهده‌ی همه‌ی محصولات" CTA linking to `/products/all`. |

---

## Task 1: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma` (append after the existing `MediaAsset` model, end of file)

**Interfaces:**
- Consumes: nothing.
- Produces: Prisma models `Product`, `ProductCategory`, `Brand`; enum `ProductAvailability` with members `IN_STOCK | OUT_OF_STOCK | CALL`. Generated types at `@/generated/prisma/client`: `Product`, `ProductCategory`, `Brand`, `ProductAvailability`, and `Prisma.ProductGetPayload`, `Prisma.ProductOrderByWithRelationInput`, etc.
- Field names later tasks depend on (exact): `Product { id, name, slug, description, images (Json), specs (Json), categoryId, brandId, availability, showPrice, price (Int?), isActive, deletedAt, createdAt, updatedAt }`; `ProductCategory { id, name, slug, icon, parentId, order, createdAt, updatedAt }` + relation names `parent` / `children` on `"CategoryTree"`; `Brand { id, name, slug, logo, description, order, createdAt, updatedAt }`.

- [ ] **Step 1: Append the enum + models to `prisma/schema.prisma`**

```prisma
enum ProductAvailability {
  IN_STOCK
  OUT_OF_STOCK
  CALL
}

model Brand {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  logo        String?
  description String?   @db.Text
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products Product[]

  @@map("brands")
}

model ProductCategory {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  icon      String?
  parentId  String?
  parent    ProductCategory?  @relation("CategoryTree", fields: [parentId], references: [id], onDelete: Restrict, onUpdate: NoAction)
  children  ProductCategory[] @relation("CategoryTree")
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  products Product[]

  @@index([parentId])
  @@map("product_categories")
}

model Product {
  id           String              @id @default(cuid())
  name         String
  slug         String              @unique
  description  String?             @db.Text
  images       Json
  specs        Json
  categoryId   String?
  category     ProductCategory?    @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  brandId      String?
  brand        Brand?              @relation(fields: [brandId], references: [id], onDelete: SetNull)
  availability ProductAvailability @default(IN_STOCK)
  showPrice    Boolean             @default(false)
  price        Int?
  isActive     Boolean             @default(true)
  deletedAt    DateTime?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  @@index([categoryId])
  @@index([brandId])
  @@index([deletedAt])
  @@map("products")
}
```

Note: `images` / `specs` are non-optional `Json` with no `@default` — MySQL cannot default a JSON column. The API always writes `[]` explicitly on create.

- [ ] **Step 2: Create and apply the migration**

Run: `npx prisma migrate dev --name add_product_catalog`
Expected: a new folder `prisma/migrations/<timestamp>_add_product_catalog/migration.sql`, migration applied, `prisma generate` runs automatically. If the DB is unreachable, start it with `docker compose up -d` first (see `docker-compose.yml`), ensure `DATABASE_URL` is set in `.env.local`.

- [ ] **Step 3: Regenerate the client explicitly (safety)**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" to `src/generated/prisma`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "$(cat <<'EOF'
feat(db): add product catalog models (Product, ProductCategory, Brand)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Shared helpers — slug uniqueness, JSON parsing, availability labels

**Files:**
- Create: `src/lib/unique-slug.ts`
- Create: `src/lib/product-json.ts`
- Modify: `src/lib/status-labels.ts` (append at end)

**Interfaces:**
- Consumes: `slugify` from `@/lib/slugify`; `sanitizePlainText` from `@/lib/sanitize`.
- Produces:
  - `ensureUniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string>` — returns `base` (or `"item"` if empty) when `exists` is false for it, else appends `-2`, `-3`, … until free.
  - `type ProductSpec = { label: string; value: string }`
  - `parseProductImages(input: unknown): string[]` — array of trimmed non-empty strings, max 12, deduped preserving order.
  - `parseProductSpecs(input: unknown): ProductSpec[]` — array of `{label,value}` where both are `sanitizePlainText`-cleaned and non-empty; drops blanks; max 40.
  - `PRODUCT_AVAILABILITY: Record<string, { label: string; className: string }>` and `PRODUCT_AVAILABILITIES: string[]` in `status-labels.ts`.

- [ ] **Step 1: Write `src/lib/unique-slug.ts`**

```ts
/**
 * Returns a slug guaranteed unique per the caller's `exists` check.
 * `exists(slug)` must resolve true when the slug is already taken
 * (by a different row — the caller scopes that, e.g. `NOT: { id }`).
 */
export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = base || "item";
  if (!(await exists(root))) return root;

  let suffix = 2;
  while (await exists(`${root}-${suffix}`)) {
    suffix += 1;
  }
  return `${root}-${suffix}`;
}
```

- [ ] **Step 2: Write `src/lib/product-json.ts`**

```ts
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
```

- [ ] **Step 3: Append to `src/lib/status-labels.ts`**

```ts
export const PRODUCT_AVAILABILITY: Record<string, { label: string; className: string }> = {
  IN_STOCK: { label: "موجود", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  OUT_OF_STOCK: { label: "ناموجود", className: "border-red-500/30 bg-red-500/10 text-red-400" },
  CALL: { label: "تماس بگیرید", className: "border-accent-500/30 bg-accent-500/10 text-accent-400" },
};

export const PRODUCT_AVAILABILITIES = Object.keys(PRODUCT_AVAILABILITY);
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors, no new warnings in the three files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/unique-slug.ts src/lib/product-json.ts src/lib/status-labels.ts
git commit -m "$(cat <<'EOF'
feat(products): add slug-uniqueness, JSON-payload, and availability-label helpers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Brand API routes

**Files:**
- Create: `src/app/api/admin/products/brands/route.ts`
- Create: `src/app/api/admin/products/brands/[id]/route.ts`

**Interfaces:**
- Consumes: `ensureUniqueSlug` (Task 2), `slugify`, `sanitizePlainText`, `prisma`, `authOptions`, `getServerSession`.
- Produces HTTP contract used by `BrandManager` (Task 6):
  - `POST /api/admin/products/brands` body `{ name: string, logo?: string|null, description?: string|null, order?: number }` → `201 { brand }` or `4xx { error }`.
  - `PATCH /api/admin/products/brands/[id]` same body shape → `200 { brand }`.
  - `DELETE /api/admin/products/brands/[id]` → `200 { ok: true }` or `400 { error }` when products reference the brand.

- [ ] **Step 1: Write `src/app/api/admin/products/brands/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام برند الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 120);
  const description =
    typeof body.description === "string" && body.description.trim()
      ? sanitizePlainText(body.description).slice(0, 1000)
      : null;
  const logo = typeof body.logo === "string" && body.logo.trim() ? body.logo.trim() : null;
  const order = Number.isFinite(body.order) ? Math.trunc(body.order) : 0;

  const slug = await ensureUniqueSlug(slugify(name), async (s) => {
    const clash = await prisma.brand.findUnique({ where: { slug: s } });
    return clash !== null;
  });

  const brand = await prisma.brand.create({ data: { name, slug, description, logo, order } });
  return NextResponse.json({ brand }, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/admin/products/brands/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.brand.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "برند یافت نشد." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام برند الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 120);
  const description =
    typeof body.description === "string" && body.description.trim()
      ? sanitizePlainText(body.description).slice(0, 1000)
      : null;
  const logo = typeof body.logo === "string" && body.logo.trim() ? body.logo.trim() : null;
  const order = Number.isFinite(body.order) ? Math.trunc(body.order) : existing.order;

  const slug = await ensureUniqueSlug(slugify(name), async (s) => {
    const clash = await prisma.brand.findFirst({ where: { slug: s, NOT: { id: existing.id } } });
    return clash !== null;
  });

  const brand = await prisma.brand.update({
    where: { id: existing.id },
    data: { name, slug, description, logo, order },
  });
  return NextResponse.json({ brand });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.brand.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "برند یافت نشد." }, { status: 404 });

  const productCount = await prisma.product.count({ where: { brandId: existing.id, deletedAt: null } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `این برند به ${productCount} محصول متصل است و قابل حذف نیست.` },
      { status: 400 },
    );
  }

  await prisma.brand.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Smoke-test with the dev server running**

Start `npm run dev` if not running. With an ADMIN session cookie (log in via the browser, copy the `next-auth.session-token`), or simply test through the UI in Task 6. Minimal curl check that the route exists and gates non-admins:

Run: `curl -s -X POST http://localhost:3000/api/admin/products/brands -H 'content-type: application/json' -d '{}'`
Expected: `{"error":"دسترسی غیرمجاز است."}` with HTTP 401.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/products/brands
git commit -m "$(cat <<'EOF'
feat(products): add brand admin API (create/update/delete with in-use guard)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: ProductCategory API routes

**Files:**
- Create: `src/app/api/admin/products/categories/route.ts`
- Create: `src/app/api/admin/products/categories/[id]/route.ts`

**Interfaces:**
- Consumes: same imports as Task 3; `CATEGORY_ICON_KEYS` from `@/lib/category-icons`.
- Produces HTTP contract used by `CategoryManager` (Task 7):
  - `POST /api/admin/products/categories` body `{ name: string, icon?: string|null, parentId?: string|null, order?: number }` → `201 { category }`.
  - `PATCH /api/admin/products/categories/[id]` same body → `200 { category }`. Rejects `parentId` that equals the row's own id or any of its descendants (`400`), and rejects making a category with children into a child (`400`).
  - `DELETE /api/admin/products/categories/[id]` → `200 { ok: true }` or `400 { error }` when the category has children or products.

- [ ] **Step 1: Write `src/app/api/admin/products/categories/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";
import { CATEGORY_ICON_KEYS } from "@/lib/category-icons";

function normalizeIcon(input: unknown): string | null {
  return typeof input === "string" && (CATEGORY_ICON_KEYS as readonly string[]).includes(input) ? input : null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام دسته الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 120);
  const icon = normalizeIcon(body.icon);
  const order = Number.isFinite(body.order) ? Math.trunc(body.order) : 0;

  let parentId: string | null = null;
  if (typeof body.parentId === "string" && body.parentId) {
    const parent = await prisma.productCategory.findUnique({ where: { id: body.parentId } });
    if (!parent) return NextResponse.json({ error: "دسته‌ی والد یافت نشد." }, { status: 400 });
    if (parent.parentId) {
      return NextResponse.json({ error: "فقط دو سطح دسته‌بندی مجاز است." }, { status: 400 });
    }
    parentId = parent.id;
  }

  const slug = await ensureUniqueSlug(slugify(name), async (s) => {
    const clash = await prisma.productCategory.findUnique({ where: { slug: s } });
    return clash !== null;
  });

  const category = await prisma.productCategory.create({ data: { name, slug, icon, order, parentId } });
  return NextResponse.json({ category }, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/admin/products/categories/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";
import { CATEGORY_ICON_KEYS } from "@/lib/category-icons";

function normalizeIcon(input: unknown): string | null {
  return typeof input === "string" && (CATEGORY_ICON_KEYS as readonly string[]).includes(input) ? input : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.productCategory.findUnique({
    where: { id: params.id },
    include: { _count: { select: { children: true } } },
  });
  if (!existing) return NextResponse.json({ error: "دسته یافت نشد." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام دسته الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 120);
  const icon = normalizeIcon(body.icon);
  const order = Number.isFinite(body.order) ? Math.trunc(body.order) : existing.order;

  let parentId: string | null = null;
  if (typeof body.parentId === "string" && body.parentId) {
    if (body.parentId === existing.id) {
      return NextResponse.json({ error: "یک دسته نمی‌تواند والد خودش باشد." }, { status: 400 });
    }
    if (existing._count.children > 0) {
      return NextResponse.json({ error: "این دسته زیردسته دارد و نمی‌تواند خودش زیردسته شود." }, { status: 400 });
    }
    const parent = await prisma.productCategory.findUnique({ where: { id: body.parentId } });
    if (!parent) return NextResponse.json({ error: "دسته‌ی والد یافت نشد." }, { status: 400 });
    if (parent.parentId) {
      return NextResponse.json({ error: "فقط دو سطح دسته‌بندی مجاز است." }, { status: 400 });
    }
    parentId = parent.id;
  }

  const slug = await ensureUniqueSlug(slugify(name), async (s) => {
    const clash = await prisma.productCategory.findFirst({ where: { slug: s, NOT: { id: existing.id } } });
    return clash !== null;
  });

  const category = await prisma.productCategory.update({
    where: { id: existing.id },
    data: { name, slug, icon, order, parentId },
  });
  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.productCategory.findUnique({
    where: { id: params.id },
    include: { _count: { select: { children: true, products: true } } },
  });
  if (!existing) return NextResponse.json({ error: "دسته یافت نشد." }, { status: 404 });

  if (existing._count.children > 0) {
    return NextResponse.json({ error: "ابتدا زیردسته‌ها را حذف کنید." }, { status: 400 });
  }
  if (existing._count.products > 0) {
    return NextResponse.json(
      { error: `این دسته به ${existing._count.products} محصول متصل است و قابل حذف نیست.` },
      { status: 400 },
    );
  }

  await prisma.productCategory.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
```

Note on the descendant check: because the schema only allows two levels (Step 1 rejects a `parentId` whose parent already has a `parentId`), "descendant" collapses to "direct children", which the `existing._count.children > 0` guard already covers. No recursive walk needed.

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Smoke-test the gate**

Run: `curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/admin/products/categories -H 'content-type: application/json' -d '{}'`
Expected: `401`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/products/categories
git commit -m "$(cat <<'EOF'
feat(products): add category admin API (two-level tree, guarded delete)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Product API routes

**Files:**
- Create: `src/app/api/admin/products/route.ts`
- Create: `src/app/api/admin/products/[id]/route.ts`

**Interfaces:**
- Consumes: `ensureUniqueSlug`, `slugify`, `sanitizePlainText`, `sanitizeRichText`, `parseProductImages`, `parseProductSpecs` (Task 2), `PRODUCT_AVAILABILITIES` (Task 2), `prisma`, `revalidatePath`.
- Produces HTTP contract used by `ProductForm` (Task 8) and `DeleteProductButton` (Task 9):
  - `POST /api/admin/products` body:
    ```ts
    {
      name: string;
      slug?: string;
      description?: string | null;
      images?: string[];
      specs?: { label: string; value: string }[];
      categoryId?: string | null;
      brandId?: string | null;
      availability?: "IN_STOCK" | "OUT_OF_STOCK" | "CALL";
      showPrice?: boolean;
      price?: number | null;
      isActive?: boolean;
    }
    ```
    → `201 { product }` or `4xx { error }`.
  - `PATCH /api/admin/products/[id]` — same body → `200 { product }`.
  - `DELETE /api/admin/products/[id]` — soft-delete → `200 { ok: true }`.

- [ ] **Step 1: Write `src/app/api/admin/products/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";
import { parseProductImages, parseProductSpecs } from "@/lib/product-json";
import { PRODUCT_AVAILABILITIES } from "@/lib/status-labels";

async function resolveCategoryId(input: unknown): Promise<string | null> {
  if (typeof input !== "string" || !input) return null;
  const found = await prisma.productCategory.findUnique({ where: { id: input } });
  return found ? found.id : null;
}

async function resolveBrandId(input: unknown): Promise<string | null> {
  if (typeof input !== "string" || !input) return null;
  const found = await prisma.brand.findUnique({ where: { id: input } });
  return found ? found.id : null;
}

function normalizeAvailability(input: unknown): "IN_STOCK" | "OUT_OF_STOCK" | "CALL" {
  return typeof input === "string" && PRODUCT_AVAILABILITIES.includes(input)
    ? (input as "IN_STOCK" | "OUT_OF_STOCK" | "CALL")
    : "IN_STOCK";
}

function normalizePrice(input: unknown, showPrice: boolean): number | null {
  if (!showPrice) return null;
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام محصول الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 200);
  const description =
    typeof body.description === "string" && body.description.trim() ? sanitizeRichText(body.description) : null;
  const images = parseProductImages(body.images);
  const specs = parseProductSpecs(body.specs);
  const showPrice = Boolean(body.showPrice);
  const price = normalizePrice(body.price, showPrice);
  const availability = normalizeAvailability(body.availability);
  const isActive = body.isActive === undefined ? true : Boolean(body.isActive);
  const categoryId = await resolveCategoryId(body.categoryId);
  const brandId = await resolveBrandId(body.brandId);

  const requestedSlug =
    typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(name);
  const slug = await ensureUniqueSlug(requestedSlug, async (s) => {
    const clash = await prisma.product.findUnique({ where: { slug: s } });
    return clash !== null;
  });

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      images,
      specs,
      categoryId,
      brandId,
      availability,
      showPrice,
      price,
      isActive,
    },
  });

  revalidatePath("/products/all");
  return NextResponse.json({ product }, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/admin/products/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitize";
import { ensureUniqueSlug } from "@/lib/unique-slug";
import { parseProductImages, parseProductSpecs } from "@/lib/product-json";
import { PRODUCT_AVAILABILITIES } from "@/lib/status-labels";

async function resolveCategoryId(input: unknown): Promise<string | null> {
  if (typeof input !== "string" || !input) return null;
  const found = await prisma.productCategory.findUnique({ where: { id: input } });
  return found ? found.id : null;
}

async function resolveBrandId(input: unknown): Promise<string | null> {
  if (typeof input !== "string" || !input) return null;
  const found = await prisma.brand.findUnique({ where: { id: input } });
  return found ? found.id : null;
}

function normalizeAvailability(input: unknown): "IN_STOCK" | "OUT_OF_STOCK" | "CALL" {
  return typeof input === "string" && PRODUCT_AVAILABILITIES.includes(input)
    ? (input as "IN_STOCK" | "OUT_OF_STOCK" | "CALL")
    : "IN_STOCK";
}

function normalizePrice(input: unknown, showPrice: boolean): number | null {
  if (!showPrice) return null;
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "نام محصول الزامی است." }, { status: 400 });
  }

  const name = sanitizePlainText(body.name).slice(0, 200);
  const description =
    typeof body.description === "string" && body.description.trim() ? sanitizeRichText(body.description) : null;
  const images = parseProductImages(body.images);
  const specs = parseProductSpecs(body.specs);
  const showPrice = Boolean(body.showPrice);
  const price = normalizePrice(body.price, showPrice);
  const availability = normalizeAvailability(body.availability);
  const isActive = body.isActive === undefined ? existing.isActive : Boolean(body.isActive);
  const categoryId = await resolveCategoryId(body.categoryId);
  const brandId = await resolveBrandId(body.brandId);

  const requestedSlug =
    typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(name);
  const slug = await ensureUniqueSlug(requestedSlug, async (s) => {
    const clash = await prisma.product.findFirst({ where: { slug: s, NOT: { id: existing.id } } });
    return clash !== null;
  });

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: { name, slug, description, images, specs, categoryId, brandId, availability, showPrice, price, isActive },
  });

  revalidatePath("/products/all");
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
  }

  await prisma.product.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });

  revalidatePath("/products/all");
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. In particular confirm Prisma accepts `images` / `specs` as plain JS arrays for a `Json` column (it does — `Prisma.InputJsonValue`).

- [ ] **Step 4: Smoke-test the gate**

Run: `curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/admin/products -H 'content-type: application/json' -d '{}'`
Expected: `401`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/products/route.ts "src/app/api/admin/products/[id]/route.ts"
git commit -m "$(cat <<'EOF'
feat(products): add product admin API (create/update, soft-delete)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Brand manager (component + page)

**Files:**
- Create: `src/components/admin/BrandManager.tsx`
- Create: `src/app/account/admin/products/brands/page.tsx`

**Interfaces:**
- Consumes: brand API from Task 3; `MediaPicker` from `@/components/admin/MediaPicker`; `ConfirmDialog` from `@/components/ConfirmDialog`; `useToast` from `@/components/ToastProvider`; `EmptyState` from `@/components/ui/EmptyState`; `Brand` type from `@/generated/prisma/client`.
- Produces: `<BrandManager brands={Brand[]} />` default export. Page default export `BrandsAdminPage` (async server component).

- [ ] **Step 1: Write `src/components/admin/BrandManager.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ToastProvider";
import { getMediaUrl } from "@/lib/media";
import type { Brand } from "@/generated/prisma/client";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Draft = { name: string; description: string; logo: string; order: string };

const EMPTY_DRAFT: Draft = { name: "", description: "", logo: "", order: "0" };

function toDraft(brand: Brand): Draft {
  return {
    name: brand.name,
    description: brand.description ?? "",
    logo: brand.logo ?? "",
    order: String(brand.order),
  };
}

export default function BrandManager({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null); // null = not editing, "new" = creating
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
  };
  const startEdit = (brand: Brand) => {
    setDraft(toDraft(brand));
    setEditingId(brand.id);
  };
  const cancel = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      showToast("نام برند الزامی است.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: draft.name,
      description: draft.description || null,
      logo: draft.logo || null,
      order: Number(draft.order) || 0,
    };
    const url = editingId === "new" ? "/api/admin/products/brands" : `/api/admin/products/brands/${editingId}`;
    const res = await fetch(url, {
      method: editingId === "new" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در ذخیره برند.", "error");
      return;
    }
    showToast(editingId === "new" ? "برند ثبت شد." : "برند به‌روزرسانی شد.");
    cancel();
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/brands/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در حذف برند.", "error");
      return;
    }
    showToast("برند حذف شد.");
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {editingId === null && (
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          برند جدید
        </button>
      )}

      {editingId !== null && (
        <div className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام برند</label>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="مثلاً Caterpillar" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیح کوتاه</label>
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className={inputClass} />
          </div>
          <MediaPicker label="لوگو" multiple={false} value={draft.logo ? [draft.logo] : []} onChange={(p) => setDraft({ ...draft, logo: p[0] ?? "" })} />
          <div className="max-w-[8rem]">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">ترتیب</label>
            <input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} className={inputClass} dir="ltr" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-600 disabled:opacity-60">
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button type="button" onClick={cancel} className="inline-flex min-h-11 items-center rounded-full border border-foreground/10 px-5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20">
              انصراف
            </button>
          </div>
        </div>
      )}

      {brands.length === 0 && editingId === null ? (
        <EmptyState icon={<Tag />} title="هنوز برندی ثبت نشده است." />
      ) : (
        <ul className="space-y-2">
          {brands.map((brand) => (
            <li key={brand.id} className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
                {brand.logo && <Image src={getMediaUrl(brand.logo)} alt="" fill sizes="40px" className="object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{brand.name}</p>
                <p dir="ltr" className="truncate text-xs text-foreground/40">{brand.slug}</p>
              </div>
              <button type="button" onClick={() => startEdit(brand)} aria-label="ویرایش" className="flex size-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                <Pencil className="size-4" />
              </button>
              <button type="button" onClick={() => setDeleteTarget(brand)} aria-label="حذف" className="flex size-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف برند"
        message={deleteTarget ? `برند «${deleteTarget.name}» حذف شود؟` : ""}
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/account/admin/products/brands/page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Tag } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BrandManager from "@/components/admin/BrandManager";

export const dynamic = "force-dynamic";

export default async function BrandsAdminPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const brands = await prisma.brand.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Tag className="size-5 text-accent-400" />
          برندها
        </h2>
        <Link
          href="/account/admin/products"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به محصولات
        </Link>
      </div>
      <BrandManager brands={brands} />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Manual browser check**

With the dev server running and logged in as an ADMIN, open `http://localhost:3000/account/admin/products/brands`. Create a brand ("Caterpillar"), confirm it appears with a slug; edit it; add a logo; delete a brand with no products and confirm it disappears. Check at 375px width that the row layout doesn't overflow.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/BrandManager.tsx src/app/account/admin/products/brands
git commit -m "$(cat <<'EOF'
feat(products): add brand manager admin page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Category manager (component + page)

**Files:**
- Create: `src/components/admin/CategoryManager.tsx`
- Create: `src/app/account/admin/products/categories/page.tsx`

**Interfaces:**
- Consumes: category API from Task 4; `CATEGORY_ICON_KEYS`, `CATEGORY_ICON_LABELS`, `CATEGORY_ICONS` from `@/lib/category-icons`; `ConfirmDialog`, `useToast`, `EmptyState`.
- Produces: `<CategoryManager categories={CategoryNode[]} />` where the page passes a flat `ProductCategory[]`; the component groups into `{ ...category, children: ProductCategory[] }`. Page default export `CategoriesAdminPage`.

- [ ] **Step 1: Write `src/components/admin/CategoryManager.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FolderTree, CornerDownLeft } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ToastProvider";
import { CATEGORY_ICON_KEYS, CATEGORY_ICON_LABELS, CATEGORY_ICONS, type CategoryIconKey } from "@/lib/category-icons";
import type { ProductCategory } from "@/generated/prisma/client";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Draft = { name: string; icon: string; order: string; parentId: string | null };

function CategoryIcon({ icon }: { icon: string | null }) {
  if (!icon || !(CATEGORY_ICON_KEYS as readonly string[]).includes(icon)) {
    return <FolderTree className="size-4 text-foreground/40" />;
  }
  return <span className="[&_svg]:size-5 text-foreground/60">{CATEGORY_ICONS[icon as CategoryIconKey]}</span>;
}

export default function CategoryManager({ categories }: { categories: ProductCategory[] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const tree = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    return roots.map((root) => ({
      ...root,
      children: categories.filter((c) => c.parentId === root.id),
    }));
  }, [categories]);

  // form state: { mode: "create" | "edit", parentId, id? }
  const [form, setForm] = useState<{ mode: "create" | "edit"; id?: string; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = (parentId: string | null) =>
    setForm({ mode: "create", draft: { name: "", icon: "", order: "0", parentId } });
  const openEdit = (c: ProductCategory) =>
    setForm({ mode: "edit", id: c.id, draft: { name: c.name, icon: c.icon ?? "", order: String(c.order), parentId: c.parentId } });
  const close = () => setForm(null);

  const save = async () => {
    if (!form) return;
    if (!form.draft.name.trim()) {
      showToast("نام دسته الزامی است.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.draft.name,
      icon: form.draft.icon || null,
      order: Number(form.draft.order) || 0,
      parentId: form.draft.parentId,
    };
    const url = form.mode === "create" ? "/api/admin/products/categories" : `/api/admin/products/categories/${form.id}`;
    const res = await fetch(url, {
      method: form.mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در ذخیره دسته.", "error");
      return;
    }
    showToast(form.mode === "create" ? "دسته ثبت شد." : "دسته به‌روزرسانی شد.");
    close();
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/categories/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در حذف دسته.", "error");
      return;
    }
    showToast("دسته حذف شد.");
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {form === null && (
        <button
          type="button"
          onClick={() => openCreate(null)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          دسته‌ی اصلی جدید
        </button>
      )}

      {form !== null && (
        <div className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="text-sm font-semibold text-foreground/70">
            {form.mode === "create"
              ? form.draft.parentId
                ? "زیردسته‌ی جدید"
                : "دسته‌ی اصلی جدید"
              : "ویرایش دسته"}
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام</label>
            <input value={form.draft.name} onChange={(e) => setForm({ ...form, draft: { ...form.draft, name: e.target.value } })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">آیکون</label>
            <select value={form.draft.icon} onChange={(e) => setForm({ ...form, draft: { ...form.draft, icon: e.target.value } })} className={inputClass}>
              <option value="">بدون آیکون</option>
              {CATEGORY_ICON_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_ICON_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="max-w-[8rem]">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">ترتیب</label>
            <input type="number" dir="ltr" value={form.draft.order} onChange={(e) => setForm({ ...form, draft: { ...form.draft, order: e.target.value } })} className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-600 disabled:opacity-60">
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button type="button" onClick={close} className="inline-flex min-h-11 items-center rounded-full border border-foreground/10 px-5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20">
              انصراف
            </button>
          </div>
        </div>
      )}

      {tree.length === 0 && form === null ? (
        <EmptyState icon={<FolderTree />} title="هنوز دسته‌بندی‌ای ثبت نشده است." />
      ) : (
        <ul className="space-y-2">
          {tree.map((root) => (
            <li key={root.id} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={root.icon} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{root.name}</p>
                  <p dir="ltr" className="truncate text-xs text-foreground/40">{root.slug}</p>
                </div>
                <button type="button" onClick={() => openCreate(root.id)} aria-label="افزودن زیردسته" className="flex size-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                  <Plus className="size-4" />
                </button>
                <button type="button" onClick={() => openEdit(root)} aria-label="ویرایش" className="flex size-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                  <Pencil className="size-4" />
                </button>
                <button type="button" onClick={() => setDeleteTarget(root)} aria-label="حذف" className="flex size-9 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10">
                  <Trash2 className="size-4" />
                </button>
              </div>

              {root.children.length > 0 && (
                <ul className="mt-2 space-y-1.5 border-r border-foreground/10 pr-3">
                  {root.children.map((child) => (
                    <li key={child.id} className="flex items-center gap-3 rounded-lg bg-foreground/[0.02] p-2">
                      <CornerDownLeft className="size-3.5 text-foreground/30" />
                      <CategoryIcon icon={child.icon} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{child.name}</p>
                        <p dir="ltr" className="truncate text-xs text-foreground/40">{child.slug}</p>
                      </div>
                      <button type="button" onClick={() => openEdit(child)} aria-label="ویرایش" className="flex size-8 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400">
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(child)} aria-label="حذف" className="flex size-8 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10">
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف دسته"
        message={deleteTarget ? `دسته‌ی «${deleteTarget.name}» حذف شود؟` : ""}
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/account/admin/products/categories/page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, FolderTree } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesAdminPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const categories = await prisma.productCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <FolderTree className="size-5 text-accent-400" />
          دسته‌بندی‌ها
        </h2>
        <Link
          href="/account/admin/products"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به محصولات
        </Link>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Manual browser check**

As ADMIN, open `/account/admin/products/categories`. Create a root category with an icon; add a subcategory to it; edit both; try to delete the root while it has a child → expect the Persian error "ابتدا زیردسته‌ها را حذف کنید."; delete the child, then the root. Check 375px layout.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/CategoryManager.tsx src/app/account/admin/products/categories
git commit -m "$(cat <<'EOF'
feat(products): add category tree manager admin page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: ProductForm component

**Files:**
- Create: `src/components/admin/ProductForm.tsx`

**Interfaces:**
- Consumes: product API from Task 5; `MediaPicker`, `RichTextEditor` from `@/components/admin/*`; `slugify`; `useToast`; `PRODUCT_AVAILABILITY` from `@/lib/status-labels`; `ProductSpec` from `@/lib/product-json`.
- Produces: default export `ProductForm` with props:
  ```ts
  type CategoryOption = { id: string; name: string; parentId: string | null };
  type BrandOption = { id: string; name: string };
  type ProductFormProps = {
    mode: "create" | "edit";
    categories: CategoryOption[];
    brands: BrandOption[];
    product?: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      images: string[];
      specs: ProductSpec[];
      categoryId: string | null;
      brandId: string | null;
      availability: string;
      showPrice: boolean;
      price: number | null;
      isActive: boolean;
    };
  };
  ```

- [ ] **Step 1: Write `src/components/admin/ProductForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, X } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { slugify } from "@/lib/slugify";
import { useToast } from "@/components/ToastProvider";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import type { ProductSpec } from "@/lib/product-json";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type CategoryOption = { id: string; name: string; parentId: string | null };
type BrandOption = { id: string; name: string };

type ProductFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  brands: BrandOption[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    images: string[];
    specs: ProductSpec[];
    categoryId: string | null;
    brandId: string | null;
    availability: string;
    showPrice: boolean;
    price: number | null;
    isActive: boolean;
  };
};

export default function ProductForm({ mode, categories, brands, product }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [specs, setSpecs] = useState<ProductSpec[]>(product?.specs ?? []);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [availability, setAvailability] = useState(product?.availability ?? "IN_STOCK");
  const [showPrice, setShowPrice] = useState(product?.showPrice ?? false);
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  const handleName = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const updateSpec = (index: number, patch: Partial<ProductSpec>) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const addSpec = () => setSpecs((prev) => [...prev, { label: "", value: "" }]);
  const removeSpec = (index: number) => setSpecs((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("نام محصول الزامی است.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name,
      slug,
      description: description && description !== "<p></p>" ? description : null,
      images,
      specs: specs.filter((s) => s.label.trim() && s.value.trim()),
      categoryId: categoryId || null,
      brandId: brandId || null,
      availability,
      showPrice,
      price: showPrice ? Number(price) || 0 : null,
      isActive,
    };
    const res = await fetch(mode === "create" ? "/api/admin/products" : `/api/admin/products/${product!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      showToast(b?.error || "خطا در ذخیره محصول.", "error");
      return;
    }
    showToast(mode === "create" ? "محصول ثبت شد." : "تغییرات ذخیره شد.");
    router.push("/account/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/account/admin/products"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به لیست محصولات
        </Link>
        <h1 className="text-sm font-semibold text-foreground/60">{mode === "create" ? "محصول جدید" : "ویرایش محصول"}</h1>
        <button
          type="submit"
          disabled={saving}
          className="mr-auto inline-flex min-h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام محصول</label>
        <input value={name} onChange={(e) => handleName(e.target.value)} className={inputClass} required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">نامک (slug)</label>
        <input
          dir="ltr"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className={inputClass}
          placeholder="product-slug"
        />
      </div>

      <MediaPicker label="تصاویر محصول" multiple value={images} onChange={setImages} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">دسته‌بندی</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">بدون دسته</option>
            {roots.map((root) => (
              <optgroup key={root.id} label={root.name}>
                <option value={root.id}>{root.name} (کلی)</option>
                {childrenOf(root.id).map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">برند</label>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputClass}>
            <option value="">بدون برند</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">وضعیت موجودی</label>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={inputClass}>
          {Object.entries(PRODUCT_AVAILABILITY).map(([value, s]) => (
            <option key={value} value={value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={showPrice}
            onChange={(e) => setShowPrice(e.target.checked)}
            className="h-4 w-4 rounded border-foreground/20 accent-accent-500"
          />
          نمایش قیمت روی سایت
        </label>
        {showPrice && (
          <div className="mt-3 max-w-xs">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">قیمت (تومان)</label>
            <input type="number" min="0" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/80">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-foreground/20 accent-accent-500"
        />
        محصول فعال (روی سایت نمایش داده شود)
      </label>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">توضیحات</label>
        <RichTextEditor value={description} onChange={setDescription} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground/80">مشخصات فنی</label>
          <button
            type="button"
            onClick={addSpec}
            className="inline-flex items-center gap-1 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Plus className="size-3.5" />
            افزودن ردیف
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((spec, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={spec.label}
                onChange={(e) => updateSpec(index, { label: e.target.value })}
                className={inputClass}
                placeholder="عنوان (مثلاً توان)"
              />
              <input
                value={spec.value}
                onChange={(e) => updateSpec(index, { value: e.target.value })}
                className={inputClass}
                placeholder="مقدار (مثلاً ۵۰۰ کیلووات)"
              />
              <button
                type="button"
                onClick={() => removeSpec(index)}
                aria-label="حذف ردیف"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {specs.length === 0 && <p className="text-xs text-foreground/40">هنوز مشخصه‌ای اضافه نشده است.</p>}
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. (The form is not yet routed; it's rendered in Task 9.)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ProductForm.tsx
git commit -m "$(cat <<'EOF'
feat(products): add product create/edit form component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Product list, rows, delete button, new/edit pages

**Files:**
- Create: `src/components/admin/DeleteProductButton.tsx`
- Create: `src/app/account/admin/products/ProductRow.tsx`
- Create: `src/app/account/admin/products/page.tsx`
- Create: `src/app/account/admin/products/new/page.tsx`
- Create: `src/app/account/admin/products/[id]/page.tsx`

**Interfaces:**
- Consumes: `ProductForm` (Task 8) and its `CategoryOption` / `BrandOption` shapes; product API (Task 5); `ListFilterBar`, `SortableHeader`, `EmptyState`, `ConfirmDialog`, `useToast`; `PRODUCT_AVAILABILITY` from `@/lib/status-labels`; `param`, `sortParams` from `@/lib/list-query`; `formatNumber` from `@/lib/format-number`; `getMediaUrl`; `Prisma` type.
- Produces: nothing consumed by later tasks (Task 10 only edits the sidebar).
- Shared type used by `ProductRow`:
  ```ts
  type ProductListItem = Prisma.ProductGetPayload<{ include: { category: true; brand: true } }>;
  ```

- [ ] **Step 1: Write `src/components/admin/DeleteProductButton.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در حذف محصول.", "error");
      return;
    }
    setOpen(false);
    showToast("محصول حذف شد.");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-red-500/30 px-3.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        <Trash2 className="size-3.5" />
        حذف
      </button>
      <ConfirmDialog
        open={open}
        title="حذف محصول"
        message={`محصول «${name}» حذف شود؟ این عملیات قابل بازگشت نیست.`}
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
```

- [ ] **Step 2: Write `src/app/account/admin/products/ProductRow.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { Pencil, ImageOff } from "lucide-react";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import { formatNumber } from "@/lib/format-number";
import { getMediaUrl } from "@/lib/media";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import type { Prisma } from "@/generated/prisma/client";

export type ProductListItem = Prisma.ProductGetPayload<{ include: { category: true; brand: true } }>;

function firstImage(images: Prisma.JsonValue): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

function AvailabilityPill({ value }: { value: string }) {
  const s = PRODUCT_AVAILABILITY[value] ?? PRODUCT_AVAILABILITY.IN_STOCK;
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.className}`}>{s.label}</span>;
}

function priceLabel(showPrice: boolean, price: number | null): string {
  if (!showPrice) return "—";
  if (price == null) return "—";
  return `${formatNumber(price)} تومان`;
}

function Thumb({ path }: { path: string | null }) {
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
      {path ? (
        <Image src={getMediaUrl(path)} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-foreground/30">
          <ImageOff className="size-4" />
        </span>
      )}
    </div>
  );
}

export function ProductCardMobile({ product }: { product: ProductListItem }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
      <div className="flex items-start gap-3">
        <Thumb path={firstImage(product.images)} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{product.name}</p>
          <p className="mt-0.5 text-xs text-foreground/50">
            {product.category?.name ?? "بدون دسته"} · {product.brand?.name ?? "بدون برند"}
          </p>
        </div>
        <AvailabilityPill value={product.availability} />
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">قیمت</dt>
          <dd dir="ltr" className="text-foreground/70">{priceLabel(product.showPrice, product.price)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">وضعیت انتشار</dt>
          <dd className="text-foreground/70">{product.isActive ? "فعال" : "غیرفعال"}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-foreground/5 pt-3">
        <Link
          href={`/account/admin/products/${product.id}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Pencil className="size-3.5" />
          ویرایش
        </Link>
        <DeleteProductButton id={product.id} name={product.name} />
      </div>
    </div>
  );
}

export function ProductRowDesktop({ product }: { product: ProductListItem }) {
  return (
    <tr className="border-t border-foreground/10">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Thumb path={firstImage(product.images)} />
          <span className="font-medium">{product.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-foreground/70">{product.category?.name ?? "—"}</td>
      <td className="px-4 py-3 text-foreground/70">{product.brand?.name ?? "—"}</td>
      <td className="px-4 py-3"><AvailabilityPill value={product.availability} /></td>
      <td dir="ltr" className="px-4 py-3 text-right text-foreground/70">{priceLabel(product.showPrice, product.price)}</td>
      <td className="px-4 py-3 text-foreground/60">{product.isActive ? "فعال" : "غیرفعال"}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/account/admin/products/${product.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Pencil className="size-3.5" />
            ویرایش
          </Link>
          <DeleteProductButton id={product.id} name={product.name} />
        </div>
      </td>
    </tr>
  );
}
```

- [ ] **Step 3: Write `src/app/account/admin/products/page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Boxes, Plus, FolderTree, Tag } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { param, sortParams, type ListSearchParams } from "@/lib/list-query";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import { ProductCardMobile, ProductRowDesktop } from "./ProductRow";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const SORT_FIELDS = ["name", "category", "brand", "availability", "price", "createdAt"] as const;

function buildOrderBy(
  field: (typeof SORT_FIELDS)[number],
  dir: "asc" | "desc",
): Prisma.ProductOrderByWithRelationInput {
  if (field === "category") return { category: { name: dir } };
  if (field === "brand") return { brand: { name: dir } };
  return { [field]: dir };
}

export default async function AdminProductsPage({ searchParams }: { searchParams: ListSearchParams }) {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const categoryId = param(searchParams, "category");
  const brandId = param(searchParams, "brand");
  const availability = param(searchParams, "availability");
  const q = param(searchParams, "q");
  const { field, dir } = sortParams(searchParams, SORT_FIELDS, "createdAt");

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(categoryId ? { categoryId } : {}),
        ...(brandId ? { brandId } : {}),
        ...(availability ? { availability: availability as Prisma.EnumProductAvailabilityFilter["equals"] } : {}),
        ...(q ? { name: { contains: q } } : {}),
      },
      orderBy: buildOrderBy(field, dir),
      include: { category: true, brand: true },
    }),
    prisma.productCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.brand.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Boxes className="size-5 text-accent-400" />
          محصولات
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/account/admin/products/categories"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <FolderTree className="size-4" />
            دسته‌بندی‌ها
          </Link>
          <Link
            href="/account/admin/products/brands"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Tag className="size-4" />
            برندها
          </Link>
          <Link
            href="/account/admin/products/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            <Plus className="size-4" />
            محصول جدید
          </Link>
        </div>
      </div>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی نام محصول..."
        selects={[
          {
            key: "category",
            label: "دسته",
            options: categories.map((c) => ({ value: c.id, label: c.parentId ? `— ${c.name}` : c.name })),
          },
          { key: "brand", label: "برند", options: brands.map((b) => ({ value: b.id, label: b.name })) },
          {
            key: "availability",
            label: "موجودی",
            options: Object.entries(PRODUCT_AVAILABILITY).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Boxes />}
          title="محصولی با این مشخصات یافت نشد."
          description="اولین محصول را ثبت کنید تا اینجا نمایش داده شود."
          action={{ label: "محصول جدید", href: "/account/admin/products/new" }}
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {products.map((product) => (
              <ProductCardMobile key={product.id} product={product} />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-foreground/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="name" label="نام" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="category" label="دسته" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="brand" label="برند" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="availability" label="موجودی" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">
                    <SortableHeader field="price" label="قیمت" />
                  </th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">انتشار</th>
                  <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductRowDesktop key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
```

If `Prisma.EnumProductAvailabilityFilter["equals"]` causes a type error, replace that line with `...(availability ? { availability: availability as never } : {})` — matching the cast already used in `contracts/page.tsx`.

- [ ] **Step 4: Write `src/app/account/admin/products/new/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const [categories, brands] = await Promise.all([
    prisma.productCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    prisma.brand.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return <ProductForm mode="create" categories={categories} brands={brands} />;
}
```

- [ ] **Step 5: Write `src/app/account/admin/products/[id]/page.tsx`**

```tsx
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { parseProductImages, parseProductSpecs } from "@/lib/product-json";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.productCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    prisma.brand.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  if (!product || product.deletedAt) notFound();

  return (
    <ProductForm
      mode="edit"
      categories={categories}
      brands={brands}
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        images: parseProductImages(product.images),
        specs: parseProductSpecs(product.specs),
        categoryId: product.categoryId,
        brandId: product.brandId,
        availability: product.availability,
        showPrice: product.showPrice,
        price: product.price,
        isActive: product.isActive,
      }}
    />
  );
}
```

- [ ] **Step 6: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. Resolve any `availability` filter typing per the note in Step 3.

- [ ] **Step 7: Manual browser check (full CRUD)**

As ADMIN:
1. `/account/admin/products` → "محصول جدید". Fill name, pick images, category, brand, availability, toggle `showPrice` and enter a price, add two spec rows, save.
2. Confirm redirect to the list and the product appears with thumbnail, category, brand, availability pill, price.
3. Edit it — change availability to "تماس بگیرید", untick `showPrice`, save → price column shows "—".
4. Filter by category / brand / availability; search by name; sort by each sortable column.
5. Delete it → row disappears (soft delete). Re-query in `db:studio` to confirm `deletedAt` is set, row still present.
6. Check 375 / 768 / 1920: card list ↔ table switch at `md`; no horizontal page scroll; table scrolls inside its own container; tap targets ≥ 44px.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/DeleteProductButton.tsx src/app/account/admin/products
git commit -m "$(cat <<'EOF'
feat(products): add product list, rows, and create/edit pages

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Sidebar navigation entry

**Files:**
- Modify: `src/components/account/AccountSidebar.tsx` (the `ADMIN_LINKS` array + the lucide import list)

**Interfaces:**
- Consumes: nothing new.
- Produces: a visible "محصولات (مدیریت)" nav item for ADMIN users pointing to `/account/admin/products`.

- [ ] **Step 1: Add `Boxes` to the lucide-react import**

In the `import { ... } from "lucide-react"` block near the top, add `Boxes,` alphabetically near the other icons (e.g. right after `AnimatePresence`-unrelated icons — placement doesn't matter functionally, keep it tidy).

- [ ] **Step 2: Add the nav link**

In `ADMIN_LINKS`, add this entry immediately after the `/account/admin/orders` line:

```ts
  { href: "/account/admin/products", label: "محصولات (مدیریت)", icon: Boxes, roles: ["ADMIN"] },
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Manual check**

As ADMIN, confirm "محصولات (مدیریت)" appears in the account sidebar under "مدیریت سایت" and navigates to the list; the item shows active styling when on any `/account/admin/products*` route (the existing `isLinkActive` prefix match handles this). Log in as a SUPPORT user (or temporarily change role) and confirm the item is hidden.

- [ ] **Step 5: Commit**

```bash
git add src/components/account/AccountSidebar.tsx
git commit -m "$(cat <<'EOF'
feat(products): add products management link to admin sidebar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Public `/products/all` placeholder + CTA on `/products`

**Files:**
- Create: `src/app/products/all/page.tsx`
- Modify: `src/app/products/page.tsx` (hero section — add one CTA link)

**Interfaces:**
- Consumes: `ThemedGridBackdrop` from `@/components/ui/ThemedGridBackdrop`; `prisma`.
- Produces: a reachable `/products/all` route; a link to it from `/products`.

- [ ] **Step 1: Write `src/app/products/all/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format-number";

export const metadata: Metadata = {
  title: "همه‌ی محصولات",
  description: "فهرست کامل محصولات پرسی؛ دیزل ژنراتور، موتور برق، قطعات یدکی و موتور ژنراتور از برندهای معتبر جهانی.",
};

export const dynamic = "force-dynamic";

export default async function AllProductsPage() {
  const count = await prisma.product.count({ where: { isActive: true, deletedAt: null } });

  return (
    <section className="relative overflow-hidden pb-16 pt-14 sm:pt-20">
      <ThemedGridBackdrop />
      <div className="container relative text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          کاتالوگ محصولات
        </span>
        <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
          همه‌ی محصولات
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance leading-7 text-foreground/70">
          {count > 0
            ? `${formatNumber(count)} محصول فعال در کاتالوگ ثبت شده است. نمایش گرید و فیلترها به‌زودی در دسترس قرار می‌گیرد.`
            : "کاتالوگ محصولات به‌زودی در دسترس قرار می‌گیرد."}
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-5 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <ArrowRight className="size-4" />
          بازگشت به دسته‌بندی محصولات
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add the CTA to `src/app/products/page.tsx`**

Add `import Link from "next/link";` if not already present. Inside the hero `<div className="container relative text-center">`, immediately after the lead `<p>...</p>` paragraph and before `</div>`, insert:

```tsx
          <div className="mt-8">
            <Link
              href="/products/all"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-500 px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
            >
              مشاهده‌ی همه‌ی محصولات
            </Link>
          </div>
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Manual browser check**

- `/products` renders unchanged except for the new "مشاهده‌ی همه‌ی محصولات" button; the button links to `/products/all`.
- `/products/all` renders the placeholder; with products in the DB it shows the count sentence, otherwise the "به‌زودی" sentence.
- Check both at 375 / 768 / 1920 — no horizontal scroll, button tap target ≥ 44px.
- `/products/all` `<title>` is "همه‌ی محصولات".

- [ ] **Step 5: Commit**

```bash
git add src/app/products/all/page.tsx src/app/products/page.tsx
git commit -m "$(cat <<'EOF'
feat(products): add /products/all placeholder page and CTA from /products

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Full verification pass (project QA checklist)

**Files:** none (verification only; fixes get their own follow-up commits if needed).

**Interfaces:** none.

- [ ] **Step 1: Static checks**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Run: `npm run build`
Expected: all pass. `build` runs `prisma generate` then `next build` — a full production compile of every new route.

- [ ] **Step 2: End-to-end manual scenario (dev server + ADMIN login)**

1. Create two brands, one root category + one subcategory, and three products spread across them (one with `showPrice` + price, one `CALL`, one `isActive:false`).
2. Product list: filters (category/brand/availability), search, all four sortable columns, mobile card view.
3. Edit a product; soft-delete a product; confirm it leaves the list.
4. Try to delete a brand attached to a product → Persian 400 error shown as a toast.
5. Try to delete a category with a subcategory → Persian 400 error.
6. `/products` shows the CTA; `/products/all` shows the correct count.

- [ ] **Step 3: Responsive + a11y pass (per project `.claude/CLAUDE.md` QA rules)**

Use `chrome-devtools-mcp` or `playwright` to screenshot at **375 / 768 / 1920**:
- `/account/admin/products` (list)
- `/account/admin/products/new` (form)
- `/account/admin/products/categories`
- `/account/admin/products/brands`
- `/products/all`

Check for: no horizontal scroll on `body`; table confined to its `overflow-x-auto` wrapper; tap targets ≥ 44px; readable font sizes; visible focus states on the new inputs/buttons; every icon-only button has an `aria-label` (they do — verify).

- [ ] **Step 4: Lighthouse on the new public page**

Run:
```
CHROME_PATH=/snap/bin/chromium npx --yes lighthouse http://localhost:3000/products/all \
  --chrome-flags='--headless=new --no-sandbox --disable-gpu' \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop --output=json --output-path=/tmp/lh-products-all.json
```
Expected: Accessibility and SEO ≥ 0.9. If the run can't execute, do the manual CWV/a11y review from the project checklist instead.

- [ ] **Step 5: Report**

Summarize results: what passed, any issues found (prioritized بحرانی / متوسط / جزئی with file:line), and — per the project rule — wait for user confirmation before fixing anything non-trivial.

- [ ] **Step 6: Final commit (only if verification produced fixes)**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(products): address verification-pass findings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**1. Spec coverage**

| Spec section | Task |
|---|---|
| `ProductAvailability` enum, `Brand`, `ProductCategory`, `Product` models, indexes, `@@map` | Task 1 |
| Migration `add_product_catalog` | Task 1 |
| Media reuse (`SITE_CONTENT` scope, no enum change) | Task 8 (uses `MediaPicker` as-is) |
| JSON payload shapes + validation (`parseProductImages`, `parseProductSpecs`, caps) | Task 2, enforced in Task 5 |
| `ensureUniqueSlug` shared helper | Task 2 |
| `PRODUCT_AVAILABILITY` labels | Task 2 |
| Brand API (POST/PATCH/DELETE + in-use guard) | Task 3 |
| Category API (two-level guard, cycle guard, children/products delete guard) | Task 4 |
| Product API (create/update, soft-delete, `revalidatePath("/products/all")`, price only when `showPrice`) | Task 5 |
| Product list page (table + mobile cards, `ListFilterBar` category/brand/availability + search, `SortableHeader` name/category/brand/availability/price/createdAt, `deletedAt: null`) | Task 9 |
| `new` / `[id]` product pages | Task 9 |
| `ProductForm` (all fields incl. specs repeater, conditional price, grouped category select) | Task 8 |
| `ProductRow` + `DeleteProductButton` | Task 9 |
| `CategoryManager` + categories page | Task 7 |
| `BrandManager` + brands page | Task 6 |
| Sidebar link (`Boxes` icon, ADMIN-only) | Task 10 |
| `/products/all` placeholder + `/products` CTA | Task 11 |
| QA: tsc, lint, build, responsive 375/768/1920, browser screenshots, Lighthouse | Task 12 |
| Out of scope (grid, facets, category pages, detail page, public search) | not planned — correct |

No gaps.

**2. Placeholder scan**

No "TBD"/"TODO"/"handle edge cases"/"similar to Task N" left. Every code step contains full file contents or an exact, located insertion. The two conditional-typing notes (Task 5 Step 3, Task 9 Step 3) give concrete fallback code, not vague instructions.

**3. Type consistency**

- `ensureUniqueSlug(base, exists)` — signature identical in Task 2 definition and Tasks 3/4/5 call sites (always `async (s) => { const clash = await ...; return clash !== null; }`).
- `parseProductImages` / `parseProductSpecs` — defined Task 2, imported in Task 5 (API) and Task 9 (`[id]` page); same names throughout.
- `ProductSpec` — exported from `@/lib/product-json` (Task 2), consumed by `ProductForm` (Task 8) and the `[id]` page (Task 9).
- `PRODUCT_AVAILABILITY` / `PRODUCT_AVAILABILITIES` — defined Task 2, used in Tasks 5, 8, 9.
- `ProductForm` props (`mode`, `categories`, `brands`, `product`) with `CategoryOption = {id,name,parentId}` and `BrandOption = {id,name}` — defined Task 8, the `new`/`[id]` pages in Task 9 pass exactly `select: { id: true, name: true, parentId: true }` and `select: { id: true, name: true }`. Match.
- `ProductListItem = Prisma.ProductGetPayload<{ include: { category: true; brand: true } }>` — defined in `ProductRow.tsx` (Task 9 Step 2), and `page.tsx` (Task 9 Step 3) queries with `include: { category: true, brand: true }`. Match.
- API delete responses: brand/category return `{ ok: true }`; product returns `{ ok: true }`; all client callers check `res.ok` only. Consistent.
- Sidebar entry uses `icon: Boxes` — import added in Task 10 Step 1. `Boxes` exists in `lucide-react`.

No inconsistencies found.
