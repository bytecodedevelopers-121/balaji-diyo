import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { CreateRoleDto, Permission, Role, UpdateRoleDto } from "@/types/role";

export interface RoleListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export const roleService = {
  getAll: (params?: RoleListParams) =>
    api.get<ApiResponse<PaginatedResponse<Role>>>("/roles", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Role>>(`/roles/${id}`).then((r) => r.data),

  create: (data: CreateRoleDto) => api.post<ApiResponse<Role>>("/roles", data).then((r) => r.data),

  update: (id: string, data: UpdateRoleDto) =>
    api.patch<ApiResponse<Role>>(`/roles/${id}`, data).then((r) => r.data),

  getPermissions: () => api.get<ApiResponse<Permission[]>>("/roles/permissions").then((r) => r.data),
};
