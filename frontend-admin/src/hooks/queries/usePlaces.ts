import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { placeService, type PlaceListParams } from "@/services/place.service";
import type { PlaceFormValues } from "@/types/place";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const usePlaces = (params?: PlaceListParams) =>
  useQuery({
    queryKey: queryKeys.places.list(params),
    queryFn: () => placeService.getAll(params),
  });

export const usePlace = (id: string) =>
  useQuery({
    queryKey: queryKeys.places.detail(id),
    queryFn: () => placeService.getById(id),
    enabled: !!id,
  });

export const useCreatePlace = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: placeService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.places.all }),
  });
};

export const useUpdatePlace = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<PlaceFormValues>) => placeService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.places.all });
      qc.invalidateQueries({ queryKey: queryKeys.places.detail(id) });
    },
  });
};

export const useDeletePlace = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => placeService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.places.all }),
  });
};
