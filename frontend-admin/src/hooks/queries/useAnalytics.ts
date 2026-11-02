import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { analyticsService } from "@/services/analytics.service";
import type { AnalyticsRange } from "@/types/analytics";

export const useAnalyticsDashboard = (range: AnalyticsRange) =>
  useQuery({
    queryKey: queryKeys.analytics.dashboard(range),
    queryFn: () => analyticsService.getDashboard(range),
    staleTime: 5 * 60 * 1000,
    // Keep the previous range's charts on screen while the new range loads,
    // instead of flashing skeletons on every selector click.
    placeholderData: keepPreviousData,
  });
