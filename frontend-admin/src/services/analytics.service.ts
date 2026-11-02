import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { AnalyticsDashboard, AnalyticsRange } from "@/types/analytics";

export const analyticsService = {
  getDashboard: (range: AnalyticsRange) =>
    api.get<ApiResponse<AnalyticsDashboard>>("/analytics/dashboard", { params: { range } }).then((r) => r.data),
};
