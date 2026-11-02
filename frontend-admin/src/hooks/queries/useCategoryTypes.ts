import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { categoryTypeService, type CategoryTypeListParams } from "@/services/category-type.service";
import type { UpdateCategoryTypeDto } from "@/types/category-type";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useCategoryTypes = (params?: CategoryTypeListParams) =>
  useQuery({
    queryKey: queryKeys.categoryTypes.list(params),
    queryFn: () => categoryTypeService.getAll(params),
  });

export const useCreateCategoryType = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: categoryTypeService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categoryTypes.all }),
  });
};

export const useUpdateCategoryType = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateCategoryTypeDto) => categoryTypeService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categoryTypes.all }),
  });
};

export const useDeleteCategoryType = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => categoryTypeService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categoryTypes.all }),
  });
};
