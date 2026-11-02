import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { packageMapService, type PackageMapListParams } from "@/services/packageMap.service";
import type { CreatePackageMapDto, UpdatePackageMapDto } from "@/types/package-map";
import { useSafeMutation } from "@/hooks/useSafeMutation";

// One shared set of hooks — used by both the top-level Trip Maps list and the
// package-nested tab (which just passes `packageId` as a filter). Create/edit
// happen on real pages (`CreateTripMapPage`/`TripMapDetailPage`), not inline,
// so there's no need for a separate packageId-bound mutation variant.

export const useAllPackageMaps = (params?: PackageMapListParams) =>
  useQuery({
    queryKey: queryKeys.packageMaps.listAll(params),
    queryFn: () => packageMapService.getAll(params),
  });

export const usePackageMap = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.packageMaps.detail(id ?? ""),
    queryFn: () => packageMapService.getById(id as string),
    enabled: !!id,
  });

export const useCreatePackageMap = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: CreatePackageMapDto) => packageMapService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packageMaps.all }),
  });
};

export const useUpdatePackageMap = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdatePackageMapDto) => packageMapService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packageMaps.all }),
  });
};

export const useDeletePackageMap = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => packageMapService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packageMaps.all }),
  });
};

export const useRestorePackageMap = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => packageMapService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packageMaps.all }),
  });
};

export const useHardDeletePackageMap = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => packageMapService.hardDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packageMaps.all }),
  });
};
