import type { PRODUCTS_QUERY_RESULT } from "./sanity.types";

/**
 * Product shape returned by the storefront API. Projected GROQ fields are
 * nullable, unlike the optional schema type, so UI and cart state use the
 * query result type instead of hand-casting API responses.
 */
export type StoreProduct = PRODUCTS_QUERY_RESULT[number];
