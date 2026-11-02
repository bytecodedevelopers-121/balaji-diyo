import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { packageService, type PackageListAdminParams } from "@/services/package.service";
import type { PackageFormValues } from "@/types/package";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { getErrorStatus } from "@/lib/apiError";

export const usePackages = (params?: PackageListAdminParams) =>
  useQuery({
    queryKey: queryKeys.packages.list(params),
    queryFn: () => packageService.getAll(params),
  });

export const usePackagesForReorder = (enabled: boolean) =>
  useQuery({
    queryKey: ["packages", "reorder-all"],
    queryFn: packageService.getAllForReorder,
    enabled,
  });

export const useReorderPackages = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (ids: string[]) => packageService.reorder(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packages.all }),
  });
};

export const usePackagesForReorderPopular = (enabled: boolean) =>
  useQuery({
    queryKey: ["packages", "reorder-popular"],
    queryFn: packageService.getAllForReorderPopular,
    enabled,
  });

export const useReorderPopularPackages = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (ids: string[]) => packageService.reorderPopular(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packages.all }),
  });
};

export const usePackagesInCategory = (categoryId: string | undefined) =>
  useQuery({
    queryKey: ["packages", "category-order", categoryId],
    queryFn: () => packageService.getAllInCategory(categoryId as string),
    enabled: !!categoryId,
  });

export const useReorderPackagesInCategory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({ categoryId, ids }: { categoryId: string; ids: string[] }) =>
      packageService.reorderInCategory(categoryId, ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packages.all }),
  });
};

export const usePackage = (id: string) =>
  useQuery({
    queryKey: queryKeys.packages.detail(id),
    queryFn: () => packageService.getById(id),
    enabled: !!id,
    // A deleted/nonexistent package 404s and can never succeed — without
    // this, the global default (`queryClient.ts`, up to 3 retries with
    // backoff) kept retrying it for ~7s with `isLoading` staying true the
    // whole time, so PackageDetailPage sat on its loading skeleton instead
    // of the "Package not found" state below for several seconds, reading
    // as a hung/broken page. Matches useItineraryByPackageId's own retry
    // override for the same reason.
    retry: (failureCount, error) => getErrorStatus(error) !== 404 && failureCount < 3,
  });

export const useCreatePackage = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: packageService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packages.all }),
  });
};

export const useUpdatePackage = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<PackageFormValues>) => packageService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.packages.all });
      qc.invalidateQueries({ queryKey: queryKeys.packages.detail(id) });
    },
  });
};

export const useDeletePackage = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => packageService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packages.all }),
  });
};

export const useRestorePackage = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => packageService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packages.all }),
  });
};

export const useHardDeletePackage = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => packageService.hardDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.packages.all }),
  });
};
