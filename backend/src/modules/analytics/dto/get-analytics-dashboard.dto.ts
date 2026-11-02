import { z } from 'zod';

export const ANALYTICS_RANGES = ['7d', '30d', '90d', '180d', '365d'] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const DEFAULT_ANALYTICS_RANGE: AnalyticsRange = '30d';

export const GetAnalyticsDashboardDto = z.object({
  range: z.enum(ANALYTICS_RANGES).default(DEFAULT_ANALYTICS_RANGE),
});

export type GetAnalyticsDashboardDtoType = z.infer<typeof GetAnalyticsDashboardDto>;
