// Shared between /api/admin/customers/search (server) and CustomerPicker
// (client) — mirrors admin-product-search.ts so both stay in sync on
// shape/limits without importing each other.
export const ADMIN_CUSTOMER_SEARCH_MIN_QUERY_LENGTH = 2;
export const ADMIN_CUSTOMER_SEARCH_LIMIT = 8;

export type AdminCustomerSearchResult = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};
