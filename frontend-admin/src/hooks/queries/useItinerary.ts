import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { itineraryService } from "@/services/itinerary.service";
import type { ItineraryFormValues } from "@/types/itinerary";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { getErrorStatus } from "@/lib/apiError";

export const useItineraryByPackageId = (packageId: string) =>
  useQuery({
    queryKey: queryKeys.itinerary.byPackage(packageId),
    queryFn: () => itineraryService.getByPackageId(packageId),
    enabled: !!packageId,
    retry: (failureCount, error) => getErrorStatus(error) !== 404 && failureCount < 2,
  });

export const useCreateItinerary = (packageId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Omit<ItineraryFormValues, "packageId">) => itineraryService.create({ ...data, packageId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.itinerary.byPackage(packageId) }),
  });
};

export const useUpdateItinerary = (packageId: string, id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<Omit<ItineraryFormValues, "packageId">>) => itineraryService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.itinerary.byPackage(packageId) }),
  });
};

export const useDeleteItinerary = (packageId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => itineraryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.itinerary.byPackage(packageId) }),
  });
};
