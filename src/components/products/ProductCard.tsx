import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import { parseProductSpecs, type ProductSpec } from "@/lib/product-json";
import StatusBadge from "@/components/ui/StatusBadge";
import ProductQuickPreview from "@/components/products/ProductQuickPreview";
import type { ProductViewMode } from "@/lib/product-view-mode";
import type { Prisma } from "@/generated/prisma/client";

export const catalogProductInclude = {
  brand: true,
  category: { include: { parent: true } },
} satisfies Prisma.ProductInclude;

export type CatalogProduct = Prisma.ProductGetPayload<{ include: typeof catalogProductInclude }>;

// How many of the product's own specs to fall back to in the quick-preview
// popover when its category hasn't curated a preview field set — same count
// as the "key features" shown on the product detail page.
const QUICK_PREVIEW_FALLBACK_COUNT = 4;

function firstImage(images: Prisma.JsonValue): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

function detailHref(product: CatalogProduct): string | null {
  const rootSlug = product.category?.parent?.slug ?? product.category?.slug;
  return rootSlug ? `/products/${rootSlug}/${product.slug}` : null;
}

function quickPreviewSpecs(product: CatalogProduct): ProductSpec[] {
  const allSpecs = parseProductSpecs(product.specs);
  const root = product.category?.parent ?? product.category ?? null;
  const previewKeys = Array.isArray(root?.previewSpecKeys)
    ? root.previewSpecKeys.filter((k): k is string => typeof k === "string")
    : [];

  if (previewKeys.length === 0) return allSpecs.slice(0, QUICK_PREVIEW_FALLBACK_COUNT);

  const byLabel = new Map(allSpecs.map((spec) => [spec.label, spec]));
  return previewKeys.map((key) => byLabel.get(key)).filter((spec): spec is ProductSpec => !!spec);
}

// Reuses the same three modes as the catalog's view-mode toggle — a card
// always renders in whatever layout the grid around it is currently using.
export type ProductCardVariant = ProductViewMode;

const CTA_CLASS =
  "relative z-10 inline-flex min-h-11 items-center rounded-full border border-accent-500/40 px-4 text-xs font-semibold text-accent-500 transition-colors hover:bg-accent-500/10";

const priceOrCta = (product: CatalogProduct) =>
  product.showPrice && product.price != null ? (
    <p dir="ltr" className="text-right text-sm font-bold text-foreground">
      {formatNumber(product.price)} تومان
    </p>
  ) : (
    <Link href="/contact" className={CTA_CLASS}>
      درخواست قیمت
    </Link>
  );

export default function ProductCard({ product, variant = "large" }: { product: CatalogProduct; variant?: ProductCardVariant }) {
  const img = firstImage(product.images);
  const availability = PRODUCT_AVAILABILITY[product.availability] ?? PRODUCT_AVAILABILITY.IN_STOCK;
  const href = detailHref(product);

  const badges = (
    <div className="flex flex-wrap items-center gap-1.5">
      {variant !== "small" && product.brand && (
        <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-[11px] text-foreground/60">{product.brand.name}</span>
      )}
      <StatusBadge status={availability} className="px-2 py-0.5" />
    </div>
  );

  // Full-width row: a small fixed-size thumbnail beside content filling the
  // rest of the row, instead of a stacked card — a different shape entirely,
  // not just a resized "large"/"small" card.
  if (variant === "list") {
    const listThumb = (
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-foreground/5 sm:w-32">
        {img ? (
          <Image src={getMediaUrl(img)} alt={product.name} fill sizes="(min-width: 640px) 128px, 96px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-foreground/25">
            <ImageOff className="size-6" />
          </span>
        )}
        {href && <Link href={href} aria-label={product.name} className="absolute inset-0" />}
      </div>
    );

    return (
      <div className="group relative flex gap-4 overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3 transition-colors hover:border-accent-500/40 sm:p-4">
        {href && <Link href={href} aria-hidden tabIndex={-1} className="absolute inset-0 z-0" />}
        {href ? (
          <ProductQuickPreview specs={quickPreviewSpecs(product)} detailHref={href} productName={product.name}>
            {listThumb}
          </ProductQuickPreview>
        ) : (
          listThumb
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
          <div>
            {href ? (
              <Link href={href} className="line-clamp-2 text-sm font-semibold leading-6 hover:text-accent-500 sm:text-base">
                {product.name}
              </Link>
            ) : (
              <h3 className="line-clamp-2 text-sm font-semibold leading-6 sm:text-base">{product.name}</h3>
            )}
            <div className="mt-1.5">{badges}</div>
          </div>
          {priceOrCta(product)}
        </div>
      </div>
    );
  }

  const compact = variant === "small";

  const media = (
    <div className="relative aspect-square w-full overflow-hidden bg-foreground/5">
      {img ? (
        <Image
          src={getMediaUrl(img)}
          alt={product.name}
          fill
          sizes={compact ? "(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 45vw" : "(min-width: 1280px) 28vw, (min-width: 768px) 40vw, 45vw"}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="flex h-full items-center justify-center text-foreground/25">
          <ImageOff className={compact ? "size-6" : "size-8"} />
        </span>
      )}
      {href && <Link href={href} aria-label={product.name} className="absolute inset-0" />}
    </div>
  );

  const title = (
    <h3 className={`line-clamp-2 font-semibold leading-6 ${compact ? "text-xs" : "text-sm"}`}>{product.name}</h3>
  );

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] transition-colors hover:border-accent-500/40">
      {href && <Link href={href} aria-hidden tabIndex={-1} className="absolute inset-0 z-0" />}
      {href ? (
        <ProductQuickPreview specs={quickPreviewSpecs(product)} detailHref={href} productName={product.name}>
          {media}
        </ProductQuickPreview>
      ) : (
        media
      )}

      <div className={`flex flex-1 flex-col gap-2 ${compact ? "p-2.5" : "p-4"}`}>
        {href ? (
          <Link href={href} className="flex min-h-11 items-center">
            {title}
          </Link>
        ) : (
          title
        )}

        {badges}

        <div className="mt-auto pt-2">
          {priceOrCta(product)}
        </div>
      </div>
    </div>
  );
}
