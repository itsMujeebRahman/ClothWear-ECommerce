import useSWR from "swr";
import { useAuth } from "@clerk/clerk-react";
import { useAuthedFetch } from "@/hooks/useAuthedFetch";
import type { Order } from "@/types/api";

export function useOrders() {
  const { isLoaded, isSignedIn } = useAuth();
  const authedFetch = useAuthedFetch();

  const { data, error, isLoading, mutate } = useSWR<Order[]>(
    isLoaded && isSignedIn ? "orders" : null,
    () => authedFetch<Order[]>("/api/orders"),
    {
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );

  return {
    orders: data ?? [],
    loading: !isLoaded || isLoading,
    error: error instanceof Error ? error.message : null,
    isSignedIn: Boolean(isSignedIn),
    refresh: mutate,
  };
}
