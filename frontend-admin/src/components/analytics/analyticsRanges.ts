import type { AnalyticsRange } from "@/types/analytics";

export const ANALYTICS_RANGES: { value: AnalyticsRange; label: string; description: string }[] = [
  { value: "7d", label: "7D", description: "Last 7 days" },
  { value: "30d", label: "30D", description: "Last 30 days" },
  { value: "90d", label: "3M", description: "Last 3 months" },
  { value: "180d", label: "6M", description: "Last 6 months" },
  { value: "365d", label: "12M", description: "Last 12 months" },
];

export const getRangeDescription = (range: AnalyticsRange) =>
  ANALYTICS_RANGES.find((r) => r.value === range)?.description ?? "";
