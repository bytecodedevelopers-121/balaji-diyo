import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { activityLogService, type ActivityLogListParams } from "@/services/activityLog.service";

export const useActivityLogs = (params?: ActivityLogListParams) =>
  useQuery({
    queryKey: queryKeys.activityLogs.list(params),
    queryFn: () => activityLogService.getAll(params),
  });
