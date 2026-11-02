import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/router";
import { useAuthStore } from "@/store/auth.store";
import { useAuthReconnect } from "@/hooks/useAuthReconnect";
import { FullPageSpinner } from "@/components/ui/FullPageSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const AppProviders = () => {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Only call initialize() after Zustand persist has finished loading from
  // localStorage.  Without this gate, get().user inside initialize() reads the
  // pre-hydration empty state.
  useEffect(() => {
    if (hasHydrated) {
      void useAuthStore.getState().initialize();
    }
  }, [hasHydrated]);

  useAuthReconnect();

  // Hold the spinner until Zustand persist has hydrated and the auth refresh
  // attempt has completed.
  if (!hasHydrated || isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
