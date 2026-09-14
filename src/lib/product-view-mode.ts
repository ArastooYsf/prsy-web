export type ProductViewMode = "large" | "small" | "list";

export const PRODUCT_VIEW_MODE_COOKIE = "productsViewMode";
const DEFAULT_MODE: ProductViewMode = "large";

export function isProductViewMode(value: unknown): value is ProductViewMode {
  return value === "large" || value === "small" || value === "list";
}

/** Server-side: resolve the view mode from a cookie value (e.g. `cookies().get(PRODUCT_VIEW_MODE_COOKIE)?.value`). */
export function resolveProductViewMode(cookieValue: string | undefined): ProductViewMode {
  return isProductViewMode(cookieValue) ? cookieValue : DEFAULT_MODE;
}
