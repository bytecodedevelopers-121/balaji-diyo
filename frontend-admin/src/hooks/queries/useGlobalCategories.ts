import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { globalCategoryService, type GlobalCategoryListParams } from "@/services/globalCategory.service";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useGlobalCategories = (params?: GlobalCategoryListParams) =>
  useQuery({
    queryKey: queryKeys.globalCategories.list(params),
    queryFn: () => globalCategoryService.getAll(params),
  });

export const useCreateGlobalCategory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: globalCategoryService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.globalCategories.all }),
  });
};
