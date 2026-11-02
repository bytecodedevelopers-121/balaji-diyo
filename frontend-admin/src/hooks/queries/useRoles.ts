import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { roleService, type RoleListParams } from "@/services/role.service";
import type { UpdateRoleDto } from "@/types/role";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useRoles = (params?: RoleListParams, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: queryKeys.roles.list(params),
    queryFn: () => roleService.getAll(params),
    enabled: options?.enabled ?? true,
  });

export const useRole = (id: string) =>
  useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => roleService.getById(id),
    enabled: !!id,
  });

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: roleService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.roles.all }),
  });
};

export const useUpdateRole = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateRoleDto) => roleService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all });
      qc.invalidateQueries({ queryKey: queryKeys.roles.detail(id) });
    },
  });
};

export const usePermissions = () =>
  useQuery({
    queryKey: queryKeys.permissions.all,
    queryFn: () => roleService.getPermissions(),
  });
