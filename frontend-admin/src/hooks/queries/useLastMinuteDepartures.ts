import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { departureService } from "@/services/departure.service";
import type { CreateDepartureDto, UpdateDepartureDto } from "@/types/departure";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useLastMinuteDepartures = (page = 1, perPage = 10) =>
  useQuery({
    queryKey: [...queryKeys.departures.lastMinute, page, perPage],
    queryFn: () => departureService.getAll({ lastMinute: true, page, perPage }),
    placeholderData: keepPreviousData,
  });

export const useCreateLastMinuteDeparture = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: CreateDepartureDto) => departureService.create({ ...data, isLastMinute: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departures.all }),
  });
};

export const useUpdateLastMinuteDeparture = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartureDto }) => departureService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departures.all }),
  });
};

export const useDeleteLastMinuteDeparture = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => departureService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departures.all }),
  });
};

/** Ids of packages that already have a last minute deal (all pages). */
export const useLastMinutePackageIds = () =>
  useQuery({
    queryKey: [...queryKeys.departures.lastMinute, "package-ids"],
    queryFn: () => departureService.getAll({ lastMinute: true, perPage: 100 }),
    select: (res) => new Set(res.data.items.map((d) => d.packageId)),
  });
