import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface ListDetailPrefetchOptions {
  /** Stable primitive string that changes when the visible set of items changes.
   *  Computed by the caller as `items.map(i => i.id).join(",")`. */
  itemIds: string;
  /** The raw item array — used only inside the effect, not as a dep. */
  items: Array<{ id: string }>;
  currentPage: number;
  totalPages: number;
  getDetailKey: (id: string) => QueryKey;
  fetchDetail: (id: string) => Promise<unknown>;
  getNextPageKey: (page: number) => QueryKey;
  fetchNextPage: (page: number) => Promise<unknown>;
  /** How fresh a detail must be before we skip the prefetch. Default 15 min. */
  detailStaleTime?: number;
  /** How fresh the next-page list must be before we skip the prefetch. Default 5 min. */
  listStaleTime?: number;
}

/**
 * Background-warms the detail cache for every item on the current list page
 * plus the next page of the list, while the device is online.
 *
 * Used by useWorkerListPrefetch, useAgentListPrefetch, etc. — each entity
 * hook wraps this with the right keys and fetch functions so call-sites only
 * pass domain-typed arrays.
 */
export function useListDetailPrefetch({
  itemIds,
  items,
  currentPage,
  totalPages,
  getDetailKey,
  fetchDetail,
  getNextPageKey,
  fetchNextPage,
  detailStaleTime = 1_000 * 60 * 15,
  listStaleTime = 1_000 * 60 * 5,
}: ListDetailPrefetchOptions): void {
  const qc = useQueryClient();
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    if (!isOnline || !itemIds) return;

    const run = async () => {
      const detailJobs = items.map((item) =>
        qc.prefetchQuery({
          queryKey: getDetailKey(item.id),
          queryFn: () => fetchDetail(item.id),
          staleTime: detailStaleTime,
        }),
      );

      const nextPage = currentPage + 1;
      const nextPageJob =
        nextPage <= totalPages
          ? qc.prefetchQuery({
              queryKey: getNextPageKey(nextPage),
              queryFn: () => fetchNextPage(nextPage),
              staleTime: listStaleTime,
            })
          : null;

      await Promise.allSettled([...detailJobs, ...(nextPageJob ? [nextPageJob] : [])]);
    };

    void run();
    // `items`, `totalPages`, and the fetch/key functions are captured from the
    // closure and are always current when `itemIds` or `currentPage` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, itemIds, currentPage]);
}
