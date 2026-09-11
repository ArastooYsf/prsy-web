# Product Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/products/[categorySlug]/[productSlug]`, a full product detail page (gallery + lightbox, specs table, price-or-request-quote, breadcrumb, related products), and wire `ProductCard` to actually link there.

**Architecture:** A new dynamic route loads the product by its globally-unique slug, resolves its root category for the URL/breadcrumb, and renders four new presentational components (`ProductGallery`, `ProductSpecsTable`, `RelatedProducts`, plus the page itself). `ProductCard` (shared with the catalog grid from the previous chunk) gains a link to this page. The "request price" CTA links to the existing ticket system, prefilled via query params; a small, narrowly-scoped fix to the existing account auth flow ensures that prefill survives an anonymous visitor's login redirect.

**Tech Stack:** Next.js 14 App Router (Server Components), Prisma 7, Tailwind, Radix UI (`@radix-ui/react-dialog`, new), `lucide-react`.

**Spec:** `docs/superpowers/specs/2026-09-11-product-detail-page-design.md`

## Global Constraints

- `Product.price` is a Prisma `Int` (MySQL `INT`, max `2_147_483_647`) — never change this column's type; this plan does not touch it.
- Products always live on **leaf** categories (`parentId` set) — never assume `product.categoryId` points to a root category. The root category for URLs/breadcrumbs is always `product.category.parent`.
- No test framework exists in this repo. Each task's verification is `npx tsc --noEmit` + `npm run lint`, plus the manual/browser check described in that task. Task 9 is the comprehensive browser QA pass.
- Any task that runs `npm run build` must `pkill -f 'next dev'` first and restart the dev server afterward (`next dev`'s `.next` directory gets corrupted by a concurrent `build` — hit twice already in this project).
- New dependency `@radix-ui/react-dialog` — install with `npm install @radix-ui/react-dialog@^1.1.23` (matches the pinned major.minor already used by `@radix-ui/react-popover` in this repo) so the lockfile updates correctly. Never hand-edit `package-lock.json`.
- All new interactive elements (buttons, links) must have a tap target ≥44px (project QA rule) — use `size-11` (44px) or `min-h-11`, matching the convention already used in `ProductCard`/`CatalogPagination`.
- `middleware.ts` already exists at the project root (admin route/API gate). Next.js supports only one middleware file — extend it, never create a second one.
- Reuse `SITE_URL` from `@/lib/site-url` for absolute URLs. Never hardcode a domain.
- The ticket API (`/api/account/tickets`) already sanitizes and length-caps `subject`/`message` server-side — prefill values passed through query params are a UX convenience only, not a new trust boundary. Still cap their length defensively before use as `defaultValue`s.

---

### Task 1: `ProductGallery` component (image strip + lightbox)

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm install`)
- Create: `src/components/products/ProductGallery.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export default function ProductGallery({ images, alt }: { images: string[]; alt: string })` — `images` are **already-parsed** relative media paths (the caller runs `parseProductImages` first); this component resolves each with `getMediaUrl` itself. Consumed by Task 5.

- [ ] **Step 1: Install the new dependency**

Run: `npm install @radix-ui/react-dialog@^1.1.23`
Expected: `package.json` gains the dependency under `dependencies`; `package-lock.json` updates.

- [ ] **Step 2: Write `ProductGallery.tsx`**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { getMediaUrl } from "@/lib/media";

export type ProductGalleryProps = {
  images: string[];
  alt: string;
};

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5">
        <ImageOff className="size-12 text-foreground/25" />
      </div>
    );
  }

  const showPrev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const showNext = () => setActiveIndex((i) => (i + 1) % images.length);

  return (
    <div>
      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label="بزرگ‌نمایی تصویر"
            className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5"
          >
            <Image
              src={getMediaUrl(images[activeIndex])}
              alt={alt}
              fill
              priority
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="object-contain"
            />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Title className="sr-only">{alt}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="بستن"
                className="absolute left-4 top-4 flex size-11 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>

            {images.length > 1 && (
              <button
                type="button"
                aria-label="تصویر قبلی"
                onClick={showPrev}
                className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <ChevronRight className="size-6" />
              </button>
            )}

            <div className="relative h-[80vh] w-full max-w-4xl">
              <Image src={getMediaUrl(images[activeIndex])} alt={alt} fill sizes="90vw" className="object-contain" />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                aria-label="تصویر بعدی"
                onClick={showNext}
                className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`تصویر ${i + 1}`}
              aria-current={i === activeIndex}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                i === activeIndex ? "border-accent-500" : "border-foreground/10 hover:border-foreground/30"
              }`}
            >
              <Image src={getMediaUrl(img)} alt="" fill sizes="4rem" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. This component isn't wired into any page yet, so no manual browser check here — Task 5 wires it in, Task 9 exercises it live.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/products/ProductGallery.tsx
git commit -m "feat(catalog): add ProductGallery component with lightbox"
```

---

### Task 2: `ProductSpecsTable` component

**Files:**
- Create: `src/components/products/ProductSpecsTable.tsx`

**Interfaces:**
- Consumes: `ProductSpec` type from `@/lib/product-json` (`{ label: string; value: string }`, already exists).
- Produces: `export default function ProductSpecsTable({ specs }: { specs: ProductSpec[] })` — renders `null` when `specs` is empty (caller decides whether to render the section heading; see Task 5). Consumed by Task 5.

- [ ] **Step 1: Write `ProductSpecsTable.tsx`**

```tsx
import type { ProductSpec } from "@/lib/product-json";

export default function ProductSpecsTable({ specs }: { specs: ProductSpec[] }) {
  if (specs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10">
      <table className="w-full text-sm">
        <tbody>
          {specs.map((spec, i) => (
            <tr key={spec.label + i} className={i % 2 === 1 ? "bg-foreground/[0.02]" : undefined}>
              <th
                scope="row"
                className="w-2/5 whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground/70 sm:w-1/3"
              >
                {spec.label}
              </th>
              <td className="px-4 py-3 text-foreground/90">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/ProductSpecsTable.tsx
git commit -m "feat(catalog): add ProductSpecsTable component"
```

---

### Task 3: Link `ProductCard` to the detail page

**Files:**
- Modify: `src/components/products/ProductCard.tsx` (full file, ~68 lines)
- Modify: `src/components/products/CatalogView.tsx:98` (the `include` on the `product.findMany` call)

**Interfaces:**
- Consumes: nothing new.
- Produces: `CatalogProduct` type now includes `category: { id, name, slug, parent: { id, name, slug } | null } | null`. Every call site building `CatalogProduct[]` (this task's `CatalogView.tsx` edit, and Task 4's `RelatedProducts.tsx`) MUST use the matching Prisma `include: { brand: true, category: { include: { parent: true } } }` or the cast to `CatalogProduct[]` will silently miss the field. Consumed by Task 4 and Task 5 (indirectly, via `ProductGrid`).

- [ ] **Step 1: Rewrite `ProductCard.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import type { Prisma } from "@/generated/prisma/client";

export type CatalogProduct = Prisma.ProductGetPayload<{
  include: { brand: true; category: { include: { parent: true } } };
}>;

function firstImage(images: Prisma.JsonValue): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

function detailHref(product: CatalogProduct): string | null {
  const rootSlug = product.category?.parent?.slug ?? product.category?.slug;
  return rootSlug ? `/products/${rootSlug}/${product.slug}` : null;
}

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const img = firstImage(product.images);
  const availability = PRODUCT_AVAILABILITY[product.availability] ?? PRODUCT_AVAILABILITY.IN_STOCK;
  const href = detailHref(product);

  const media = (
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
  );

  const title = <h3 className="line-clamp-2 text-sm font-semibold leading-6">{product.name}</h3>;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] transition-colors hover:border-accent-500/40">
      {href ? (
        <Link href={href} className="contents">
          {media}
        </Link>
      ) : (
        media
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        {href ? <Link href={href}>{title}</Link> : title}

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
              className="inline-flex min-h-11 items-center rounded-full border border-accent-500/40 px-4 text-xs font-semibold text-accent-500 transition-colors hover:bg-accent-500/10"
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

- [ ] **Step 2: Update the `include` in `CatalogView.tsx`**

Find (around line 92-100):
```ts
    prisma.product.findMany({
      where: q.where,
      orderBy: q.orderBy,
      skip: q.skip,
      take: q.take,
      include: { brand: true },
    }) as Promise<CatalogProduct[]>,
```

Replace with:
```ts
    prisma.product.findMany({
      where: q.where,
      orderBy: q.orderBy,
      skip: q.skip,
      take: q.take,
      include: { brand: true, category: { include: { parent: true } } },
    }) as Promise<CatalogProduct[]>,
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. (`tsc` will fail if the `include` and the `CatalogProduct` type payload drift out of sync — that's the point of this check.)

Manual check: with the dev server running, open `http://localhost:3000/products/all`, click a product card's image or name — expect navigation to `/products/{rootCategorySlug}/{productSlug}` (the route doesn't exist yet until Task 5, so a 404 here is expected and fine — this only confirms the *href* is correct; full navigation is verified in Task 9).

Check the href directly instead: `curl -s http://localhost:3000/products/all | grep -o '/products/diesel-generator/[^"]*' | head -3` — expect to see product-slug paths, not just the bare category path.

- [ ] **Step 4: Commit**

```bash
git add src/components/products/ProductCard.tsx src/components/products/CatalogView.tsx
git commit -m "feat(catalog): link ProductCard to the product detail page"
```

---

### Task 4: `RelatedProducts` component

**Files:**
- Create: `src/components/products/RelatedProducts.tsx`

**Interfaces:**
- Consumes: `CatalogProduct` type and `ProductGrid` from Task 3 (`ProductGrid` unchanged, already exists).
- Produces: `export default async function RelatedProducts({ categoryId, excludeProductId }: { categoryId: string; excludeProductId: string })` — an async Server Component; renders `null` when there are no siblings. Consumed by Task 5.

- [ ] **Step 1: Write `RelatedProducts.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/products/ProductGrid";
import type { CatalogProduct } from "@/components/products/ProductCard";

export default async function RelatedProducts({
  categoryId,
  excludeProductId,
}: {
  categoryId: string;
  excludeProductId: string;
}) {
  const products = (await prisma.product.findMany({
    where: {
      categoryId,
      isActive: true,
      deletedAt: null,
      id: { not: excludeProductId },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { brand: true, category: { include: { parent: true } } },
  })) as CatalogProduct[];

  if (products.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="mb-4 text-lg font-bold sm:text-xl">محصولات مشابه</h2>
      <ProductGrid products={products} />
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/RelatedProducts.tsx
git commit -m "feat(catalog): add RelatedProducts component"
```

---

### Task 5: The product detail route

**Files:**
- Create: `src/app/products/[categorySlug]/[productSlug]/page.tsx`

**Interfaces:**
- Consumes: `ProductGallery` (Task 1), `ProductSpecsTable` (Task 2), `RelatedProducts` (Task 4), `Breadcrumb`/`Crumb` (existing, `src/components/products/Breadcrumb.tsx`), `ThemedProse` (existing, `src/components/ui/ThemedProse.tsx`), `parseProductImages`/`parseProductSpecs` (existing, `@/lib/product-json`), `sanitizePlainText`/`sanitizeRichText` (existing, `@/lib/sanitize`), `SITE_URL` (existing, `@/lib/site-url`).
- Produces: the route itself. The "درخواست قیمت" link target (`/account/tickets/new?subject=...&message=...`) is consumed by Task 6 (which makes that destination actually honor the params — this task's link works correctly even before Task 6 lands, it just won't pre-fill yet).

- [ ] **Step 1: Write the route**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitize";
import { parseProductImages, parseProductSpecs } from "@/lib/product-json";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import { SITE_URL } from "@/lib/site-url";
import Breadcrumb, { type Crumb } from "@/components/products/Breadcrumb";
import ProductGallery from "@/components/products/ProductGallery";
import ProductSpecsTable from "@/components/products/ProductSpecsTable";
import RelatedProducts from "@/components/products/RelatedProducts";
import ThemedProse from "@/components/ui/ThemedProse";

export const dynamic = "force-dynamic";

async function loadProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { brand: true, category: { include: { parent: true } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string; productSlug: string };
}): Promise<Metadata> {
  const product = await loadProduct(params.productSlug);
  if (!product || !product.isActive || product.deletedAt) return { title: "محصول" };

  const plainDescription = product.description
    ? sanitizePlainText(product.description).slice(0, 160)
    : `${product.name} — مشاهده مشخصات فنی و استعلام قیمت.`;
  const images = parseProductImages(product.images);

  return {
    title: product.name,
    description: plainDescription,
    openGraph: {
      title: product.name,
      description: plainDescription,
      images: images[0] ? [getMediaUrl(images[0])] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { categorySlug: string; productSlug: string };
}) {
  const product = await loadProduct(params.productSlug);
  if (!product || !product.isActive || product.deletedAt) notFound();

  const leafCategory = product.category;
  const rootSlug = leafCategory?.parent?.slug ?? leafCategory?.slug ?? null;
  if (!rootSlug) notFound();

  if (params.categorySlug !== rootSlug) {
    redirect(`/products/${rootSlug}/${product.slug}`);
  }

  const images = parseProductImages(product.images);
  const specs = parseProductSpecs(product.specs);
  const availability = PRODUCT_AVAILABILITY[product.availability] ?? PRODUCT_AVAILABILITY.IN_STOCK;

  const crumbs: Crumb[] = [{ label: "همه‌ی محصولات", href: "/products/all" }];
  if (leafCategory?.parent) {
    crumbs.push({ label: leafCategory.parent.name, href: `/products/${leafCategory.parent.slug}` });
    crumbs.push({
      label: leafCategory.name,
      href: `/products/${leafCategory.parent.slug}?sub=${leafCategory.slug}`,
    });
  } else if (leafCategory) {
    crumbs.push({ label: leafCategory.name, href: `/products/${leafCategory.slug}` });
  }
  crumbs.push({ label: product.name });

  const canonicalUrl = `${SITE_URL}/products/${rootSlug}/${product.slug}`;
  const requestPriceHref = `/account/tickets/new?subject=${encodeURIComponent(
    `استعلام قیمت: ${product.name}`
  )}&message=${encodeURIComponent(`درخواست قیمت برای محصول: ${product.name}\n${canonicalUrl}`)}`;

  return (
    <section className="container py-8">
      <Breadcrumb items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <ProductGallery images={images} alt={product.name} />

        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.brand && (
              <span className="rounded-md bg-foreground/5 px-2.5 py-1 text-xs text-foreground/70">
                {product.brand.name}
              </span>
            )}
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${availability.className}`}>
              {availability.label}
            </span>
          </div>

          <div className="mt-6">
            {product.showPrice && product.price != null ? (
              <p dir="ltr" className="text-right text-2xl font-bold text-foreground">
                {formatNumber(product.price)} تومان
              </p>
            ) : (
              <Link
                href={requestPriceHref}
                className="inline-flex min-h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600"
              >
                درخواست قیمت
              </Link>
            )}
          </div>

          {product.description && (
            <ThemedProse
              html={sanitizeRichText(product.description)}
              className="prose prose-sm mt-6 max-w-none leading-8 [&_a]:text-accent-400"
            />
          )}
        </div>
      </div>

      {specs.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold sm:text-xl">مشخصات فنی</h2>
          <ProductSpecsTable specs={specs} />
        </div>
      )}

      {leafCategory && <RelatedProducts categoryId={leafCategory.id} excludeProductId={product.id} />}
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

Manual check (dev server running): `curl -sI http://localhost:3000/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا | head -1` — expect `HTTP/1.1 200 OK` (this specific slug exists from `prisma/seed-catalog.ts`, seeded in a prior chunk). Full interactive verification happens in Task 9, after Task 8 enriches the seed data with real gallery images/specs for this product.

- [ ] **Step 3: Commit**

```bash
git add "src/app/products/[categorySlug]/[productSlug]/page.tsx"
git commit -m "feat(catalog): add product detail page route"
```

---

### Task 6: Ticket-form prefill

**Files:**
- Modify: `src/components/account/NewTicketForm.tsx`
- Modify: `src/app/account/tickets/new/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `NewTicketForm` accepts optional `initialSubject`/`initialMessage` props. No new exports consumed elsewhere.

- [ ] **Step 1: Add prefill props to `NewTicketForm.tsx`**

Find:
```tsx
export default function NewTicketForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
```

Replace with:
```tsx
export default function NewTicketForm({
  initialSubject = "",
  initialMessage = "",
}: {
  initialSubject?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);
  const [saving, setSaving] = useState(false);
```

- [ ] **Step 2: Read `searchParams` in `tickets/new/page.tsx`**

Replace the full file with:
```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NewTicketForm from "@/components/account/NewTicketForm";

export const metadata: Metadata = {
  title: "ثبت تیکت جدید",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" ? v.slice(0, 500) : "";
}

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: { subject?: string | string[]; message?: string | string[] };
}) {
  const session = await getServerSession(authOptions);

  if (session!.user.role !== "CUSTOMER") {
    redirect("/account/admin");
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">ثبت تیکت جدید</h2>
      <div className="mx-auto max-w-xl">
        <NewTicketForm
          initialSubject={firstParam(searchParams.subject)}
          initialMessage={firstParam(searchParams.message)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

Manual check: log in as a CUSTOMER-role test user, visit `http://localhost:3000/account/tickets/new?subject=%D8%AA%D8%B3%D8%AA&message=%D9%BE%DB%8C%D8%A7%D9%85` — expect the "موضوع" field pre-filled with "تست" and "متن پیام" pre-filled with "پیام".

- [ ] **Step 4: Commit**

```bash
git add src/components/account/NewTicketForm.tsx "src/app/account/tickets/new/page.tsx"
git commit -m "feat(tickets): support prefilling subject/message via query params"
```

---

### Task 7: Preserve the callback URL for anonymous visitors

**Files:**
- Modify: `middleware.ts` (project root)
- Modify: `src/app/account/layout.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by other tasks — this is a standalone fix, verified independently and in Task 9's end-to-end flow.

- [ ] **Step 1: Extend `middleware.ts`**

Replace the full file with:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/account")) {
    const headers = new Headers(request.headers);
    headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.next({ request: { headers } });
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.role === "ADMIN") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*"],
};
```

This adds an early-return branch for `/account/:path*` that only forwards a header — it does not change the existing `/admin`/`/api/admin` admin-token-gate logic below it (that logic was never reached for `/account/*` requests before this change either; `/account/admin` is protected independently by `src/app/account/admin/layout.tsx`'s own role check).

- [ ] **Step 2: Read the header in `AccountLayout`**

Find (`src/app/account/layout.tsx`):
```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountShell from "@/components/account/AccountShell";
```
Replace with:
```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountShell from "@/components/account/AccountShell";
```

Find:
```tsx
  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }
```
Replace with:
```tsx
  if (!session?.user) {
    const pathname = headers().get("x-pathname") ?? "/account";
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

Manual check (dev server running, logged out): `curl -sI "http://localhost:3000/account/tickets/new?subject=x&message=y" | grep -i location` — expect `location: /login?callbackUrl=%2Faccount%2Ftickets%2Fnew%3Fsubject%3Dx%26message%3Dy`.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts "src/app/account/layout.tsx"
git commit -m "fix(auth): preserve full path+query in the login callbackUrl for /account"
```

---

### Task 8: Enrich seed data for gallery/specs QA coverage

**Files:**
- Modify: `prisma/seed-catalog.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: seeded products with varied `images`/`specs` shapes, consumed by Task 9's QA script (exact slugs listed there).

Today every seeded product has `images: []` and exactly one spec row — there's no data to exercise the gallery's multi-image/lightbox path or the specs table's multi-row path. This task gives four representative products (already in `PRODUCTS`) richer `images`/`specs`, reusing the four existing product-category SVGs under `public/media/products/` (the same files `DEFAULT_HERO_SLIDES` already reference) rather than adding new binary assets.

- [ ] **Step 1: Add overrides and apply them in the upsert loop**

Find (`prisma/seed-catalog.ts`, right after the `PRODUCTS` array, before `const INACTIVE_SLUG = ...`):
```ts
const INACTIVE_SLUG = "seed-inactive-product";
```

Replace with:
```ts
const GALLERY_IMAGES = ["products/diesel-generators.svg", "products/power-engines.svg", "products/spare-parts.svg"];

// Gives a handful of seeded products richer images/specs than the loop's
// defaults below, so the product-detail page's gallery/lightbox and specs
// table have real multi-item data to render during QA. Keyed by product
// name (not slug — the slug is derived from the name further down).
const PRODUCT_OVERRIDES: Record<string, { images?: string[]; specs?: { label: string; value: string }[] }> = {
  "دیزل ژنراتور کاترپیلار ۵۰۰ کاوا": {
    images: GALLERY_IMAGES,
    specs: [
      { label: "توان خروجی", value: "۵۰۰ کاوا" },
      { label: "مدل موتور", value: "Caterpillar C15" },
      { label: "ولتاژ", value: "۴۰۰/۲۳۰ ولت" },
      { label: "وزن", value: "۴٬۲۰۰ کیلوگرم" },
    ],
  },
  "دیزل ژنراتور پرکینز ۲۵۰ کاوا": {
    images: GALLERY_IMAGES.slice(0, 2),
    specs: [
      { label: "توان خروجی", value: "۲۵۰ کاوا" },
      { label: "مدل موتور", value: "Perkins 2206C-E13TAG2" },
    ],
  },
  "موتور برق بنزینی ۵ کاوا": {
    images: GALLERY_IMAGES.slice(0, 1),
  },
  "دیزل ژنراتور دریایی ولوو ۱۵۰ کاوا": {
    specs: [],
  },
};

const INACTIVE_SLUG = "seed-inactive-product";
```

Find:
```ts
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
```

Replace with:
```ts
  for (const [subSlug, brandSlug, name, availability, showPrice, price] of PRODUCTS) {
    const slug = name
      .trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-").toLowerCase();
    const override = PRODUCT_OVERRIDES[name];
    const images = override?.images ?? [];
    const specs = override?.specs ?? [{ label: "برند", value: name.split(" ").pop() ?? "" }];
    await prisma.product.upsert({
      where: { slug },
      update: {
        name, categoryId: subIdBySlug.get(subSlug) ?? null, brandId: brandIdBySlug.get(brandSlug) ?? null,
        availability, showPrice, price, isActive: true, deletedAt: null,
        images, specs,
      },
      create: {
        name, slug, categoryId: subIdBySlug.get(subSlug) ?? null, brandId: brandIdBySlug.get(brandSlug) ?? null,
        availability, showPrice, price, isActive: true,
        images, specs,
      },
    });
  }
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 3: Re-run the seed script**

Run: `npm run db:seed:catalog`
Expected: `seeded 6 brands, 5 categories, 19 products` (idempotent — safe to re-run; existing rows are updated, not duplicated).

Manual check: `curl -s http://localhost:3000/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا | grep -c 'aria-label="تصویر'` — expect `3` (one per thumbnail button, once Task 1's gallery is wired in via Task 5, which it already is by this point in the plan).

- [ ] **Step 4: Commit**

```bash
git add prisma/seed-catalog.ts
git commit -m "test(catalog): enrich seed data with multi-image/multi-spec products"
```

---

### Task 9: End-to-end browser QA pass

**Files:**
- Create (scratch, not committed): a temporary Node script under the scratchpad directory.

**Interfaces:**
- Consumes: the full feature (Tasks 1-8).
- Produces: a pass/fail report. Per project rule, any failures found here are reported to the user and fixed only after explicit confirmation — do not silently patch and re-run.

This project has no MCP-based browser tooling that works in this sandbox (`chrome-devtools-mcp` and the Playwright MCP both lack a usable Chrome binary here — a known, recurring limitation). Instead, drive Playwright's own bundled Chromium directly via a plain Node script, the same approach that worked for the previous chunk's final QA.

- [ ] **Step 1: Confirm the dev server is running**

Run: `curl -sI http://localhost:3000/ | head -1`
Expected: `HTTP/1.1 200 OK`. If not running, start it with `npm run dev &` and wait for "Ready" in its output before continuing.

- [ ] **Step 2: Write the QA script**

Write to `/tmp/claude-1000/-home-arastooysf-Projects-prsy-website/*/scratchpad/qa-product-detail.mjs` (use this session's actual scratchpad path):

```js
import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = "http://localhost:3000";
const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push([name, "PASS"]);
  } catch (err) {
    results.push([name, `FAIL: ${err.message}`]);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();
const heroScope = ".grid.gap-8.lg\\:grid-cols-2";

await check("priced product shows price, no CTA in the hero block", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا`, { waitUntil: "networkidle" });
  const priceText = await page.locator(`${heroScope} >> text=تومان`).first().textContent();
  assert.ok(priceText?.includes("تومان"), "expected price text in hero block");
  const ctaCount = await page.locator(`${heroScope} a:has-text('درخواست قیمت')`).count();
  assert.equal(ctaCount, 0, "priced product's hero block should not show a request-price CTA");
});

await check("unpriced product shows CTA with correct prefill href", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-پرکینز-۲۵۰-کاوا`, { waitUntil: "networkidle" });
  const cta = page.locator(`${heroScope} a:has-text('درخواست قیمت')`);
  await cta.first().waitFor({ state: "visible" });
  const href = await cta.first().getAttribute("href");
  assert.ok(href?.startsWith("/account/tickets/new?subject="), `unexpected href: ${href}`);
  assert.ok(decodeURIComponent(href).includes("پرکینز"), "href should mention the product name");
});

await check("multi-image gallery: thumbnails render, lightbox opens/navigates/closes", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا`, { waitUntil: "networkidle" });
  const thumbs = page.locator("button[aria-label^='تصویر ']");
  assert.equal(await thumbs.count(), 3, "expected 3 thumbnails");
  await page.locator("button[aria-label='بزرگ‌نمایی تصویر']").click();
  await page.locator("[role=dialog]").waitFor({ state: "visible" });
  await page.locator("button[aria-label='تصویر بعدی']").click();
  await page.keyboard.press("Escape");
  await page.locator("[role=dialog]").waitFor({ state: "hidden" });
});

await check("single-image product shows no thumbnail strip", async () => {
  await page.goto(`${BASE}/products/power-engine/موتور-برق-بنزینی-۵-کاوا`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("button[aria-label^='تصویر ']").count(), 0);
});

await check("zero-image product renders a placeholder without crashing", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-دریایی-ولوو-۱۵۰-کاوا`, { waitUntil: "networkidle" });
  const h1 = await page.locator("h1").first().textContent();
  assert.ok(h1?.includes("ولوو"));
});

await check("empty specs: the specs section is omitted entirely", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-دریایی-ولوو-۱۵۰-کاوا`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("text=مشخصات فنی").count(), 0);
});

await check("populated specs: all rows render", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("table tr").count(), 4);
});

await check("breadcrumb chain is correct and links are correct", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا`, { waitUntil: "networkidle" });
  const hrefs = await page
    .locator("nav[aria-label='مسیر ناوبری'] a")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  assert.deepEqual(hrefs, [
    "/products/all",
    "/products/diesel-generator",
    "/products/diesel-generator?sub=diesel-generator-industrial",
  ]);
});

await check("related products render for a leaf category with siblings", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("h2:has-text('محصولات مشابه')").count(), 1);
});

await check("related products section is absent for a leaf with no siblings", async () => {
  await page.goto(`${BASE}/products/generator-engine/موتور-ژنراتور-کاترپیلار-c18`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("h2:has-text('محصولات مشابه')").count(), 0);
});

await check("clicking a category card lands on the canonical product URL", async () => {
  await page.goto(`${BASE}/products/all`, { waitUntil: "networkidle" });
  await page.locator("a[href*='/products/diesel-generator/']").first().click();
  await page.waitForURL(/\/products\/diesel-generator\/.+/);
});

await check("wrong root-category slug redirects to the canonical URL", async () => {
  await page.goto(`${BASE}/products/power-engine/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا`, { waitUntil: "networkidle" });
  assert.equal(page.url(), `${BASE}/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا`);
});

await check("nonexistent product slug shows the 404 page", async () => {
  await page.goto(`${BASE}/products/diesel-generator/does-not-exist`, { waitUntil: "networkidle" });
  assert.ok((await page.textContent("body"))?.includes("این مسیر رو پیدا نکردیم"));
});

await check("inactive product slug shows the 404 page", async () => {
  await page.goto(`${BASE}/products/diesel-generator/seed-inactive-product`, { waitUntil: "networkidle" });
  assert.ok((await page.textContent("body"))?.includes("این مسیر رو پیدا نکردیم"));
});

await check("anonymous request-price click preserves prefill through the login redirect", async () => {
  await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-پرکینز-۲۵۰-کاوا`, { waitUntil: "networkidle" });
  await page.locator(`${heroScope} a:has-text('درخواست قیمت')`).first().click();
  await page.waitForURL(/\/login\?callbackUrl=/);
  const callbackUrl = decodeURIComponent(new URL(page.url()).searchParams.get("callbackUrl") ?? "");
  assert.ok(callbackUrl.startsWith("/account/tickets/new?subject="), `unexpected callbackUrl: ${callbackUrl}`);
});

const customerEmail = process.env.CUSTOMER_EMAIL;
const customerPassword = process.env.CUSTOMER_PASSWORD;
if (customerEmail && customerPassword) {
  await check("logged-in customer: CTA click lands directly on a prefilled ticket form", async () => {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill("#email", customerEmail);
    await page.fill("#password", customerPassword);
    await page.waitForFunction(() => document.querySelector("button[type=submit]")?.hasAttribute("disabled") === false);
    await page.locator("button[type=submit]").click();
    await page.waitForURL(/\/account/);

    await page.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-پرکینز-۲۵۰-کاوا`, { waitUntil: "networkidle" });
    await page.locator(`${heroScope} a:has-text('درخواست قیمت')`).first().click();
    await page.waitForURL(/\/account\/tickets\/new\?subject=/);
    const subjectValue = await page.locator("input[placeholder='موضوع تیکت']").inputValue();
    assert.ok(subjectValue.includes("پرکینز"), `subject not prefilled: ${subjectValue}`);
  });
} else {
  results.push([
    "logged-in customer: CTA click lands directly on a prefilled ticket form",
    "SKIP (CUSTOMER_EMAIL/CUSTOMER_PASSWORD not set in this environment)",
  ]);
}

await check("mobile (375px): no horizontal overflow, tap targets >=44px", async () => {
  const mobile = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await mobile.goto(`${BASE}/products/diesel-generator/دیزل-ژنراتور-پرکینز-۲۵۰-کاوا`, { waitUntil: "networkidle" });
  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  assert.equal(overflow, false, "horizontal overflow detected at 375px");
  const ctaBox = await mobile.locator(`${heroScope} a:has-text('درخواست قیمت')`).first().boundingBox();
  assert.ok(ctaBox && ctaBox.height >= 44, `CTA height too small: ${ctaBox?.height}`);
  const thumbBox = await mobile.locator("button[aria-label^='تصویر ']").first().boundingBox();
  assert.ok(thumbBox && thumbBox.width >= 44 && thumbBox.height >= 44, "thumbnail tap target too small");
  await mobile.close();
});

await browser.close();

let failed = false;
for (const [name, status] of results) {
  const tag = status.startsWith("PASS") ? "PASS" : status.startsWith("SKIP") ? "SKIP" : "FAIL";
  console.log(`${tag} — ${name}${tag === "PASS" ? "" : `: ${status}`}`);
  if (tag === "FAIL") failed = true;
}
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: Run it**

Run: `npx --yes -p playwright node /path/to/scratchpad/qa-product-detail.mjs`
Expected: 17 `PASS` lines and exit code 0 if `CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD` are set in the environment (18 checks total, all passing); 16 `PASS` + 1 `SKIP` if those env vars are unset — a `SKIP` is not a failure and does not affect the exit code.

If anything fails, **do not fix it inline as part of this task.** Report the failing checks (name + error) as findings, same as the rest of this project's QA process — fixes happen only after explicit user confirmation of scope.

- [ ] **Step 4: Also run Lighthouse on the detail page**

Run:
```bash
CHROME_PATH=/snap/bin/chromium npx --yes lighthouse "http://localhost:3000/products/diesel-generator/دیزل-ژنراتور-کاترپیلار-۵۰۰-کاوا" \
  --chrome-flags='--headless=new --no-sandbox --disable-gpu' \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop --output=json --output-path=/tmp/lh-product-detail.json
```
If `/snap/bin/chromium` isn't present in this sandbox (it wasn't for the previous chunk's Lighthouse attempts), report that and fall back to the QA script's manual Core Web Vitals-relevant checks (no CLS-inducing layout shift from the gallery/lightbox, no render-blocking additions) instead — per the project's QA instructions, this is an acceptable documented fallback, not a blocking failure.

- [ ] **Step 5: Report results**

Summarize pass/fail counts and any Lighthouse scores to the user. Do not commit anything in this task — it produces no code changes, only a verification report.
