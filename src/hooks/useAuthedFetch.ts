import { useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch, ApiError } from "@/lib/api";

export function useAuthedFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async <T,>(
      path: string,
      options: {
        method?: "GET" | "POST";
        body?: unknown;
        signal?: AbortSignal;
      } = {},
    ): Promise<T> => {
      const token = await getToken();
      if (!token) {
        throw new ApiError("Please sign in to continue.", 401, "unauthorized");
      }
      return apiFetch<T>(path, { ...options, token });
    },
    [getToken],
  );
}
