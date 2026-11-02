import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { costCategoryService, type CostCategoryListParams } from "@/services/cost-category.service";
import type { CostCategoryFormValues } from "@/types/cost-category";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useCostCategories = (params?: CostCategoryListParams) =>
  useQuery({
    queryKey: queryKeys.costCategories.list(params),
    queryFn: () => costCategoryService.getAll(params),
  });

export const useCreateCostCategory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: costCategoryService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.costCategories.all }),
  });
};

export const useUpdateCostCategory = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<CostCategoryFormValues>) => costCategoryService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.costCategories.all }),
  });
};

export const useDeleteCostCategory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => costCategoryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.costCategories.all }),
  });
};
