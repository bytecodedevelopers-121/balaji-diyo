import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { menuItemService } from "@/services/menuItem.service";
import type { UpdateMenuItemDto, CreateMenuItemDto } from "@/types/menu-item";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useMenuItemTree = (typeId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.menuItems.tree(typeId ?? ""),
    queryFn: () => menuItemService.getTree(typeId as string),
    enabled: !!typeId,
  });

export const useCreateMenuItem = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: CreateMenuItemDto) => menuItemService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menuItems.all }),
  });
};

export const useUpdateMenuItem = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateMenuItemDto) => menuItemService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menuItems.all }),
  });
};

export const useDeleteMenuItem = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => menuItemService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menuItems.all }),
  });
};

// Persists one sibling group's full order in a single bulk write (both the
// inline ↑/↓ buttons and the Reorder drawer go through this).
export const useReorderMenuItems = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: { typeId: string; parentId: string | null; ids: string[] }) => menuItemService.reorder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.menuItems.all }),
  });
};
