import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format-number";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import type { Prisma } from "@/generated/prisma/client";

export const catalogProductInclude = {
  brand: true,
  category: { include: { parent: true } },
} satisfies Prisma.ProductInclude;

export type CatalogProduct = Prisma.ProductGetPayload<{ include: typeof catalogProductInclude }>;

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
        <Link href={href} className="contents" aria-label={product.name}>
          {media}
        </Link>
      ) : (
        media
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        {href ? (
          <Link href={href} className="flex min-h-11 items-center">
            {title}
          </Link>
        ) : (
          title
        )}

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
