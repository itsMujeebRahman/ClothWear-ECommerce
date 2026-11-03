import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/types/sanity.types";

export function useCategories() {
  const { data, error, isLoading } = useSWR<Category[]>(
    "categories",
    () => apiFetch<Category[]>("/api/categories"),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    categories: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
