import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { userService, type UserListParams } from "@/services/user.service";
import type { ResetPasswordDto, UpdateUserDto } from "@/types/user";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { useListDetailPrefetch } from "@/hooks/useListDetailPrefetch";

export const useUsers = (params?: UserListParams) =>
  useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.getAll(params),
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: userService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
};

export const useUpdateUser = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateUserDto) => userService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
};

export const useActivateUser = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: () => userService.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
};

export const useDeactivateUser = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: () => userService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
};

export const useResetPassword = (id: string) => {
  return useSafeMutation({
    mutationFn: (data: ResetPasswordDto) => userService.resetPassword(id, data),
  });
};

export function useUserListPrefetch(
  users: Array<{ id: string }>,
  currentPage: number,
  totalPages: number,
  baseParams: UserListParams,
): void {
  useListDetailPrefetch({
    itemIds: users.map((u) => u.id).join(","),
    items: users,
    currentPage,
    totalPages,
    getDetailKey: (id) => queryKeys.users.detail(id),
    fetchDetail: (id) => userService.getById(id),
    getNextPageKey: (nextPage) => queryKeys.users.list({ ...baseParams, page: nextPage }),
    fetchNextPage: (nextPage) => userService.getAll({ ...baseParams, page: nextPage }),
  });
}
