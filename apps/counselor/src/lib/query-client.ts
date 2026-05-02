import { QueryClient } from "@tanstack/react-query";

// Phase 10.3: shared TanStack Query defaults across all 5 portals. Tuned for
// dashboard-heavy UIs where stale data for a few seconds is fine but a full
// refetch on every tab focus would feel chatty.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
