import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitize";
import { linkifyKnownPhrases } from "@/lib/site-section-links";
import { parseProductImages, parseProductSpecs } from "@/lib/product-json";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import { toPersianDigits } from "@/lib/format-number";
import { SITE_URL, toAbsoluteUrl } from "@/lib/site-url";
import Breadcrumb, { type Crumb } from "@/components/products/Breadcrumb";
import ProductGallery from "@/components/products/ProductGallery";
import ProductSpecsTable from "@/components/products/ProductSpecsTable";
import ProductBuyBox from "@/components/products/ProductBuyBox";
import ProductTabs, { type ProductTabSection } from "@/components/products/ProductTabs";
import ProductComments, { type ProductCommentItem } from "@/components/products/ProductComments";
import RelatedProducts from "@/components/products/RelatedProducts";
import ThemedProse from "@/components/ui/ThemedProse";
import StatusBadge from "@/components/ui/StatusBadge";
import { safeDecode } from "@/lib/slug-param";

export const dynamic = "force-dynamic";

const KEY_FEATURE_COUNT = 4;

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
  const rootSlug = product.category?.parent?.slug ?? product.category?.slug;

  return {
    title: product.name,
    description: plainDescription,
    alternates: rootSlug ? { canonical: `${SITE_URL}/products/${rootSlug}/${product.slug}` } : undefined,
    openGraph: {
      title: product.name,
      description: plainDescription,
      images: images[0] ? [getMediaUrl(images[0])] : undefined,
    },
  };
}

const AVAILABILITY_SCHEMA_MAP: Record<string, string> = {
  IN_STOCK: "https://schema.org/InStock",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
};

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
  const keyFeatures = specs.slice(0, KEY_FEATURE_COUNT);
  const availability = PRODUCT_AVAILABILITY[product.availability] ?? PRODUCT_AVAILABILITY.IN_STOCK;

  const session = await getServerSession(authOptions);
  // Everyone else's comments only show once approved — but the viewer's OWN
  // comment (any status) must stay visible to them the whole time, or a
  // freshly-submitted PENDING comment would vanish the instant they refresh,
  // with no way to see/edit/delete the thing they just wrote.
  const commentRows = await prisma.productComment.findMany({
    where: {
      productId: product.id,
      deletedAt: null,
      OR: [{ status: "APPROVED" }, ...(session?.user ? [{ userId: session.user.id }] : [])],
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, images: true },
  });
  const comments: ProductCommentItem[] = commentRows.map((comment) => ({
    id: comment.id,
    text: comment.text,
    rating: comment.rating,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() ?? null,
    authorId: comment.userId,
    authorName: comment.user.name || comment.user.email,
    status: comment.status,
    images: comment.images.map((img) => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      mimeType: img.mimeType,
    })),
  }));

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
  const ctaLabel = product.showPrice && product.price != null ? "سفارش این محصول" : "درخواست قیمت";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ label: "خانه", href: "/" }, ...crumbs].map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${SITE_URL}${crumb.href}` } : {}),
    })),
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.slug,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(images[0] ? { image: [toAbsoluteUrl(getMediaUrl(images[0]))] } : {}),
    ...(product.description ? { description: sanitizePlainText(product.description).slice(0, 500) } : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "IRT",
      ...(product.showPrice && product.price != null ? { price: product.price } : {}),
      ...(AVAILABILITY_SCHEMA_MAP[product.availability]
        ? { availability: AVAILABILITY_SCHEMA_MAP[product.availability] }
        : {}),
    },
  };

  const tabSections: ProductTabSection[] = [];
  if (specs.length > 0) {
    tabSections.push({ id: "specs", label: "مشخصات فنی", content: <ProductSpecsTable specs={specs} /> });
  }
  if (product.description) {
    tabSections.push({
      id: "description",
      label: "توضیحات",
      content: (
        <ThemedProse
          html={linkifyKnownPhrases(sanitizeRichText(product.description))}
          className="prose prose-sm max-w-none leading-8 [&_a]:text-accent-400"
        />
      ),
    });
  }

  tabSections.push({
    id: "comments",
    label: `دیدگاه‌ها (${toPersianDigits(comments.length)})`,
    content: (
      <ProductComments
        productId={product.id}
        comments={comments}
        isLoggedIn={!!session?.user}
        viewerId={session?.user?.id ?? null}
      />
    ),
  });

  return (
    <section className="container pb-24 pt-8 lg:pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumb items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,32rem)_1fr_20rem]">
        <ProductGallery key={product.id} images={images} alt={product.name} />

        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.brand && (
              <span className="rounded-md bg-foreground/5 px-2.5 py-1 text-xs text-foreground/70">
                {product.brand.name}
              </span>
            )}
            <StatusBadge status={availability} className="px-2.5 py-1 text-xs" />
          </div>

          {keyFeatures.length > 0 && (
            <ul className="mt-5 space-y-2 border-t border-foreground/10 pt-5">
              {keyFeatures.map((spec) => (
                <li key={spec.label} className="flex items-baseline gap-2 text-sm">
                  <span className="text-foreground/50">{spec.label}:</span>
                  <span className="font-semibold text-foreground">{spec.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ProductBuyBox
          showPrice={product.showPrice}
          price={product.price}
          availability={availability}
          ctaHref={requestPriceHref}
          ctaLabel={ctaLabel}
        />
      </div>

      {tabSections.length > 0 && (
        <div className="mt-10">
          <ProductTabs sections={tabSections} />
        </div>
      )}

      {leafCategory && <RelatedProducts categoryId={leafCategory.id} excludeProductId={product.id} />}
    </section>
  );
}
