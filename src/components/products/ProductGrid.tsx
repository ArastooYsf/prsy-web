import ProductCard, { type CatalogProduct, type ProductCardVariant } from "@/components/products/ProductCard";
import type { ProductViewMode } from "@/lib/product-view-mode";

const DEFAULT_GRID_CLASS = "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4";

export const CATALOG_GRID_CLASS: Record<ProductViewMode, string> = {
  large: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
  small: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  list: "flex flex-col gap-3",
};

export default function ProductGrid({
  products,
  variant = "large",
  className = DEFAULT_GRID_CLASS,
}: {
  products: CatalogProduct[];
  variant?: ProductCardVariant;
  className?: string;
}) {
  return (
    <div className={className}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={variant} />
      ))}
    </div>
  );
}
