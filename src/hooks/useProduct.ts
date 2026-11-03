import { useEffect } from "react";
import useSWR from "swr";
import { apiFetch, ApiError, getErrorMessage } from "@/lib/api";
import { PRODUCTS_CHANGED_EVENT } from "@/components/layout/SanityLive";
import type { ProductDetail } from "@/types/api";

export function useProduct(slug: string | undefined) {
  const key = slug ? `/api/products/${encodeURIComponent(slug)}` : null;
  const { data, error, isLoading, mutate } = useSWR<ProductDetail>(
    key,
    (url: string) => apiFetch<ProductDetail>(url),
    {
      revalidateOnFocus: false,
      keepPreviousData: false,
    },
  );

  useEffect(() => {
    if (!key) {
      return;
    }
    const handleRefresh = () => {
      void mutate();
    };
    window.addEventListener(PRODUCTS_CHANGED_EVENT, handleRefresh);
    return () => window.removeEventListener(PRODUCTS_CHANGED_EVENT, handleRefresh);
  }, [key, mutate]);

  const notFound =
    !slug || (error instanceof ApiError && error.status === 404);

  return {
    product: data ?? null,
    loading: Boolean(key) && isLoading,
    notFound,
    error: error && !notFound ? getErrorMessage(error) : null,
  };
}
