import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import {
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_PRODUCT_LIMIT,
  SEARCH_CATEGORY_LIMIT,
  type SiteSearchResponse,
} from "@/lib/site-search";

function firstImage(images: unknown): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

// A leaner, purpose-built select than ProductCard's `catalogProductInclude`
// (icon/order/specTemplateKey etc. would just be dead weight on a query that
// runs on every debounced keystroke) — same root-slug rule as its
// `detailHref` though: a product's own category if it's already a root, or
// its parent's slug if it's a subcategory.
function productHref(product: { slug: string; category: { slug: string; parent: { slug: string } | null } | null }): string | null {
  const rootSlug = product.category?.parent?.slug ?? product.category?.slug;
  return rootSlug ? `/products/${rootSlug}/${product.slug}` : null;
}

// Root categories live at /products/[slug]; a subcategory has no route of
// its own and is reached via its root's `?sub=` filter (see catalog-query.ts).
function categoryHref(category: { slug: string; parentId: string | null; parent: { slug: string } | null }): string {
  return category.parentId && category.parent
    ? `/products/${category.parent.slug}?sub=${category.slug}`
    : `/products/${category.slug}`;
}

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const empty: SiteSearchResponse = { products: [], categories: [] };
  if (q.length < SEARCH_MIN_QUERY_LENGTH) return NextResponse.json(empty);

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [{ name: { contains: q } }, { brand: { name: { contains: q } } }, { description: { contains: q } }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        showPrice: true,
        price: true,
        brand: { select: { name: true } },
        category: { select: { slug: true, parent: { select: { slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: SEARCH_PRODUCT_LIMIT,
    }),
    prisma.productCategory.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, slug: true, parentId: true, parent: { select: { name: true, slug: true } } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      take: SEARCH_CATEGORY_LIMIT,
    }),
  ]);

  const response: SiteSearchResponse = {
    products: products.flatMap((product) => {
      const href = productHref(product);
      if (!href) return [];
      const image = firstImage(product.images);
      return [
        {
          id: product.id,
          name: product.name,
          image: image ? getMediaUrl(image) : null,
          brandName: product.brand?.name ?? null,
          showPrice: product.showPrice,
          price: product.price,
          href,
        },
      ];
    }),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      parentName: category.parent?.name ?? null,
      href: categoryHref(category),
    })),
  };

  return NextResponse.json(response);
}
