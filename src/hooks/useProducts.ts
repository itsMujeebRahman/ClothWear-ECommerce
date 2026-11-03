import { useEffect } from "react";
import useSWR from "swr";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { PRODUCTS_CHANGED_EVENT } from "@/components/layout/SanityLive";
import type { StoreProduct } from "@/types/product";

export interface ProductQuery {
  variant?: string;
  category?: string;
  search?: string;
  enabled?: boolean;
}

function buildQuery(params: ProductQuery): string {
  const searchParams = new URLSearchParams();
  if (params.variant) {
    searchParams.set("variant", params.variant);
  }
  if (params.category) {
    searchParams.set("category", params.category);
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/**
 * SWR keys filter requests by their query string, so a slow response for an
 * older filter can never overwrite the current result.
 */
export function useProducts(params: ProductQuery) {
  const { enabled = true } = params;
  const requestKey = enabled ? buildQuery(params) : "";
  const key = enabled ? `/api/products${requestKey}` : null;

  const { data, error, isLoading, mutate } = useSWR<StoreProduct[]>(
    key,
    (url: string) => apiFetch<StoreProduct[]>(url),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    const handleRefresh = () => {
      void mutate();
    };
    window.addEventListener(PRODUCTS_CHANGED_EVENT, handleRefresh);
    return () => window.removeEventListener(PRODUCTS_CHANGED_EVENT, handleRefresh);
  }, [mutate]);

  return {
    products: enabled ? (data ?? []) : [],
    loading: enabled && isLoading,
    error: error ? getErrorMessage(error) : null,
    requestKey,
    reload: () => mutate(),
  };
}
