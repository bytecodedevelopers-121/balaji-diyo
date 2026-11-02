import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { categoryService, type CategoryListParams } from "@/services/category.service";
import type { UpdateCategoryDto } from "@/types/category";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useCategories = (params?: CategoryListParams) =>
  useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoryService.getAll(params),
  });

export const useCategoryTree = (typeId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.categories.tree(typeId ?? ""),
    queryFn: () => categoryService.getTree(typeId as string),
    enabled: !!typeId,
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: categoryService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useUpdateCategory = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateCategoryDto) => categoryService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useRestoreCategory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => categoryService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useHardDeleteCategory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => categoryService.hardDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};
