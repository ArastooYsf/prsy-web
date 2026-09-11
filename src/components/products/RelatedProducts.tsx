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
