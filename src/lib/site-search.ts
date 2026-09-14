// Shared between the search API route (server) and HeaderSearch (client) so
// the two stay in sync on shape/limits without either importing the other.
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_PRODUCT_LIMIT = 6;
export const SEARCH_CATEGORY_LIMIT = 5;

export type SearchProductResult = {
  id: string;
  name: string;
  image: string | null;
  brandName: string | null;
  showPrice: boolean;
  price: number | null;
  href: string;
};

export type SearchCategoryResult = {
  id: string;
  name: string;
  /** Root category name, when this result is a subcategory — e.g. "دیزل ژنراتور" for "دیزل ژنراتور صنعتی". Null for a root category. */
  parentName: string | null;
  href: string;
};

export type SiteSearchResponse = {
  products: SearchProductResult[];
  categories: SearchCategoryResult[];
};
