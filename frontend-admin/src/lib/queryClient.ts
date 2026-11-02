import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { isConnectionError } from "@/lib/connectionError";

function getStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1_000 * 60 * 10, // 10 min: serve from cache without refetch
      retry: (failureCount, error) => {
        if (isConnectionError(error)) return false;
        const status = getStatus(error);
        if (status === 401 || status === 403) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: "online",
      retry: false,
    },
  },
});

/**
 * Clears the in-memory query cache. Call on logout so the next session
 * starts with a clean slate.
 */
export function clearQueryCache(): void {
  queryClient.getQueryCache().clear();
}
