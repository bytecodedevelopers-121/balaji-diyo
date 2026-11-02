import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { ActivityLog } from "@/types/activity-log";

export interface ActivityLogListParams {
  page?: number;
  perPage?: number;
  loggerType?: string;
  loggerId?: string;
  actionCategory?: string;
}

// Read-only, deliberately: activity logs are written internally via the
// backend's ActivityLogRepository.log(), never through the API — there is no
// create/update/delete route to call here.
export const activityLogService = {
  getAll: (params?: ActivityLogListParams) =>
    api.get<ApiResponse<PaginatedResponse<ActivityLog>>>("/activity-logs", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<ActivityLog>>(`/activity-logs/${id}`).then((r) => r.data),
};
