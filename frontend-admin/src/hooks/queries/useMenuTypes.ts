import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { menuTypeService, type MenuTypeListParams } from "@/services/menuType.service";
import type { UpdateMenuTypeDto } from "@/types/menu-type";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useMenuTypes = (params?: MenuTypeListParams) =>
  useQuery({
    queryKey: queryKeys.menuTypes.list(params),
    queryFn: () => menuTypeService.getAll(params),
  });

export const useMenuType = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.menuTypes.detail(id ?? ""),
    queryFn: () => menuTypeService.getById(id as string),
    enabled: !!id,
  });

export const useCreateMenuType = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: menuTypeService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menuTypes.all }),
  });
};

export const useUpdateMenuType = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateMenuTypeDto) => menuTypeService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menuTypes.all }),
  });
};

export const useDeleteMenuType = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => menuTypeService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menuTypes.all }),
  });
};
