export type CartItem = {
  productId: string;
  name: string;
  /** Full detail-page path (/products/[root]/[slug]), or null for a product with no resolvable category. */
  href: string | null;
  price: number;
  image: string | null;
  quantity: number;
};

export const CART_STORAGE_KEY = "yashar:cart";
