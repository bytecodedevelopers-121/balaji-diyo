import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { departureService } from "@/services/departure.service";
import type { CreateDepartureDto, CreateDeparturesBulkDto, UpdateDepartureDto } from "@/types/departure";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useDepartures = (packageId: string) =>
  useQuery({
    queryKey: queryKeys.departures.list(packageId),
    queryFn: () => departureService.getAll({ packageId, perPage: 100 }),
    enabled: !!packageId,
  });

export const useCreateDeparture = (packageId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Omit<CreateDepartureDto, "packageId">) => departureService.create({ ...data, packageId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departures.list(packageId) }),
  });
};

export const useCreateDeparturesBulk = (packageId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Omit<CreateDeparturesBulkDto, "packageId">) => departureService.createBulk({ ...data, packageId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departures.list(packageId) }),
  });
};

export const useUpdateDeparture = (packageId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartureDto }) => departureService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departures.list(packageId) }),
  });
};

export const useDeleteDeparture = (packageId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => departureService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departures.list(packageId) }),
  });
};
