import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { tripInfoService, type TripInfoListParams } from "@/services/trip-info.service";
import type { UpdateTripInfoDto } from "@/types/trip-info";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useTripInfos = (params?: TripInfoListParams) =>
  useQuery({
    queryKey: queryKeys.tripInfos.list(params),
    queryFn: () => tripInfoService.getAll(params),
  });

export const useCreateTripInfo = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: tripInfoService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tripInfos.all }),
  });
};

export const useUpdateTripInfo = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateTripInfoDto) => tripInfoService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tripInfos.all }),
  });
};

export const useDeleteTripInfo = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => tripInfoService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tripInfos.all }),
  });
};
