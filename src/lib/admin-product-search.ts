// Shared between /api/admin/products/search (server) and ProductPicker
// (client) — mirrors the site-search.ts split so both stay in sync on
// shape/limits without importing each other.
export const ADMIN_PRODUCT_SEARCH_MIN_QUERY_LENGTH = 2;
export const ADMIN_PRODUCT_SEARCH_LIMIT = 8;

export type AdminProductSearchResult = {
  id: string;
  name: string;
  brandName: string | null;
  price: number | null;
};
