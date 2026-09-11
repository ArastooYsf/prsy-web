# Product detail page — design

Date: 2026-09-11
Status: approved (chat), awaiting written-spec review

## Context

Chunks 1–2 built the `Product`/`ProductCategory`/`Brand` models, the admin
CRUD panel, and the category-catalog pages (`/products/[categorySlug]`,
`/products/all`) with URL-driven facets. Clicking a product card today goes
nowhere — `ProductCard` only links its price CTA, to a bare `/contact` with
no form. This chunk adds a real product detail page and wires cards to it.

Products always live on **leaf** categories (a child with a `parentId`),
never directly on a root category — confirmed in `CatalogView.tsx`'s
existing comment and in `prisma/seed-catalog.ts`.

## Route structure

`/products/[categorySlug]/[productSlug]/page.tsx`, where `categorySlug` is
the product's **root** category slug (not the leaf). Since
`Product.slug` is globally unique, the product is looked up by
`productSlug` alone; `categorySlug` is a canonical/vanity segment used for
the URL shape and the breadcrumb, not for the lookup query.

```ts
const product = await prisma.product.findUnique({
  where: { slug: params.productSlug },
  include: {
    brand: true,
    category: { include: { parent: true } },
  },
});

if (!product || !product.isActive || product.deletedAt) notFound();

const canonicalRootSlug = product.category?.parent?.slug ?? product.category?.slug;
if (!canonicalRootSlug) notFound(); // orphaned product, no category at all

if (params.categorySlug !== canonicalRootSlug) {
  redirect(`/products/${canonicalRootSlug}/${product.slug}`); // 307, not permanent — categories can change
}
```

`generateMetadata`: `title: product.name`, `description` derived from
`product.description` (strip HTML, truncate ~160 chars) with a fallback
sentence if empty, `openGraph.images` from the first parsed gallery image
(via `getMediaUrl`) when present.

`export const dynamic = "force-dynamic"` (matches the other catalog pages
— no ISR caching layer exists yet for this data).

## `ProductCard` gets a real link

`CatalogProduct` (the Prisma payload type in `ProductCard.tsx`) gains
`category: { select: { slug: true, parent: { select: { slug: true } } } }`
in its `include`. Both call sites that build `CatalogProduct[]` —
`CatalogView.tsx`'s `product.findMany` and the new `RelatedProducts` query
— add that `include` field.

`ProductCard` wraps its image + name in a `Link` to
`/products/${product.category?.parent?.slug ?? product.category?.slug}/${product.slug}`.
If a product somehow has no category (defensive — shouldn't happen given
soft-required category assignment in the admin form), the card renders
without a link (name/image as plain elements, price/CTA row unchanged) —
matches the project's "don't add handling for scenarios that can't
happen" rule, just enough to not crash on stale/edge-case data.

## Page content

**Breadcrumb** (reusing the existing `Breadcrumb` component):
همه‌ی محصولات (`/products/all`) › `{rootCategory.name}` (`/products/{rootSlug}`) › `{leafCategory.name}` (`/products/{rootSlug}?sub={leafSlug}`) › `{product.name}` (current).

**`ProductGallery`** (new, client component, `src/components/products/ProductGallery.tsx`):
- Parses `product.images` via the existing `parseProductImages` from `@/lib/product-json`.
- Zero images: same placeholder pattern `ProductCard` already uses (`ImageOff` icon in a bordered box) — no gallery chrome.
- One image: main image only, still opens the lightbox on click (zoom is still useful), no thumbnail strip, no prev/next.
- 2+ images: thumbnail strip (RTL-ordered) + main image; clicking the main image opens a Radix `Dialog` lightbox with the same image at larger size and prev/next buttons (`ChevronRight`/`ChevronLeft` from `lucide-react`, matching RTL direction already used elsewhere in the catalog components) plus `Escape`-to-close (native Radix `Dialog` behavior).
- New dependency: `@radix-ui/react-dialog` (approved). Package.json + lockfile updated by the implementing task.

**`ProductSpecsTable`** (new, `src/components/products/ProductSpecsTable.tsx`):
- Input: `parseProductSpecs(product.specs)` from `@/lib/product-json` (existing helper, already used by the admin form).
- Renders a simple two-column table/definition-list, RTL, label right-aligned bold, value regular. Section (including its heading) is omitted entirely when the parsed array is empty.

**Price / CTA block** (inline in the page, not a new shared component — it's a bigger one-off layout, unlike `ProductCard`'s compact version):
- `product.showPrice && product.price != null` → price in Tomans, same `formatNumber` + `dir="ltr"` pattern as `ProductCard`.
- Otherwise → "درخواست قیمت" button linking to:
  `/account/tickets/new?subject=${encodeURIComponent("استعلام قیمت: " + product.name)}&message=${encodeURIComponent("درخواست قیمت برای محصول: " + product.name + "\n" + canonicalProductUrl)}`
  (`canonicalProductUrl` = `` `${SITE_URL}/products/${canonicalRootSlug}/${product.slug}` ``, reusing the existing `SITE_URL` constant from `@/lib/site-url` — already used the same way in `src/lib/notifications/events.ts` for ticket/order links).
- Availability pill reused from `PRODUCT_AVAILABILITY` (`@/lib/status-labels`), same as `ProductCard`.

**`RelatedProducts`** (new, `src/components/products/RelatedProducts.tsx`):
- Query: up to 4 other `isActive && !deletedAt` products sharing the same **leaf** `categoryId`, ordered by `createdAt desc`, excluding the current product.
- Renders via the existing `ProductGrid`. Section (including heading "محصولات مشابه") omitted entirely when the result is empty.

## Ticket prefill plumbing

`NewTicketForm` (`src/components/account/NewTicketForm.tsx`) gains two
optional props, `initialSubject?: string` and `initialMessage?: string`,
used as the initial value of its existing `useState("")` calls. No other
behavior changes — submission still goes through the same
`/api/account/tickets` POST, which already sanitizes and length-caps
`subject`/`message` server-side, so the prefill is a pure UX convenience
with no new trust boundary.

`src/app/account/tickets/new/page.tsx` reads `searchParams.subject` /
`searchParams.message` (each capped to a sane length, e.g. `.slice(0, 500)`,
before being handed to the client component — defensive, not a security
boundary since the API re-validates) and passes them through.

## Anonymous-visitor callback fix

Today, `AccountLayout` (`src/app/account/layout.tsx`) does:
```ts
if (!session?.user) redirect("/login?callbackUrl=/account");
```
This drops whatever sub-path the visitor was actually headed to. For this
feature specifically, an anonymous visitor clicking "درخواست قیمت" would
land back on generic `/account` after logging in, losing the prefilled
ticket. Since this is likely the common case for a public product page,
it's fixed as part of this chunk:

- `middleware.ts` already exists at the project root (it gates `/admin/:path*`
  and `/api/admin/:path*` with a JWT role check). Extend its matcher with
  `/account/:path*` and add an early-return branch for that prefix that
  clones the request headers, sets `x-pathname` to
  `request.nextUrl.pathname + request.nextUrl.search`, and returns
  `NextResponse.next({ request: { headers } })` — before the existing
  admin-token check, so that logic is unaffected. Next.js supports only one
  middleware file, so this must be an edit, not a new file.
- `AccountLayout` reads `headers().get("x-pathname") ?? "/account"` and
  builds `redirect(\`/login?callbackUrl=${encodeURIComponent(pathname)}\`)`.
- No other behavior of the login flow changes — `LoginForm` already reads
  an explicit `callbackUrl` from `searchParams`.

This is scoped narrowly (one matcher, one header, one call site) rather
than a general middleware/auth refactor.

## Testing plan

Real-browser pass (Playwright — `chrome-devtools-mcp` has no usable Chrome
binary in this sandbox, same limitation hit in chunk 2) against seeded
data from `prisma/seed-catalog.ts`:

1. Open a product with `showPrice: true` → price renders, no CTA button.
2. Open a product with `showPrice: false` → "درخواست قیمت" button present,
   correct href.
3. Open a product with multiple images → thumbnails render, click opens
   lightbox, prev/next cycles, `Escape` closes.
4. Open a product with 0 images → placeholder renders, no crash.
5. Open a product with empty `specs` → specs section absent.
6. Open a product with populated `specs` → table renders all pairs.
7. Confirm breadcrumb chain is correct and each crumb link navigates
   correctly (root category page, leaf-filtered category page).
8. Confirm related products render for a leaf category with siblings, and
   are absent for one without.
9. Click a `ProductCard` in `/products/all` and in a category page →
   lands on the correct canonical detail URL.
10. Visit `/products/{wrong-root-slug}/{real-product-slug}` → redirects to
    the canonical URL.
11. Visit a nonexistent/inactive product slug → 404.
12. Logged-out: click "درخواست قیمت" → login → confirm landing back on
    `/account/tickets/new` with the subject/message fields prefilled
    (verifies the `middleware.ts` fix).
13. Logged-in customer: same click → form prefilled directly, submit
    works, ticket created with the expected subject/message.
14. Mobile viewport (375px): gallery, specs table, and CTA remain usable,
    no horizontal overflow, tap targets ≥44px (project QA rule).

## Explicitly out of scope

- No changes to the `Ticket` schema (no `productId` field) — the product
  reference travels only as text in the message body + a link.
  Deferred: if support later wants ticket→product linking, that's a
  separate schema decision.
- No "add to cart" / e-commerce checkout — this site's model is
  quote-request via ticket, not direct purchase.
- No image zoom-on-hover / pinch-zoom beyond the lightbox's larger view.
- No changes to `/products/[categorySlug]` or `/products/all` beyond the
  `ProductCard` link + `include` addition.
- No general middleware/auth refactor beyond the one `/account/:path*`
  matcher described above.
