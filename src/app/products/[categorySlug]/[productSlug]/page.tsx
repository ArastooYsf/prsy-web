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

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

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
  const product = await loadProduct(safeDecode(params.productSlug));
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
  const product = await loadProduct(safeDecode(params.productSlug));
  if (!product || !product.isActive || product.deletedAt) notFound();

  const leafCategory = product.category;
  const rootSlug = leafCategory?.parent?.slug ?? leafCategory?.slug ?? null;
  if (!rootSlug) notFound();

  if (safeDecode(params.categorySlug) !== rootSlug) {
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
