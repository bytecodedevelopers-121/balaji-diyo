import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  ChangePasswordDto,
  CreateUserDto,
  ResetPasswordDto,
  UpdateProfileDto,
  UpdateUserDto,
  User,
} from "@/types/user";

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  status?: "active" | "inactive";
}

export const userService = {
  getAll: (params?: UserListParams) =>
    api.get<ApiResponse<PaginatedResponse<User>>>("/users", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUserDto) => api.post<ApiResponse<User>>("/users", data).then((r) => r.data),

  update: (id: string, data: UpdateUserDto) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, data).then((r) => r.data),

  activate: (id: string) => api.patch<ApiResponse<User>>(`/users/${id}/activate`).then((r) => r.data),

  deactivate: (id: string) => api.patch<ApiResponse<User>>(`/users/${id}/deactivate`).then((r) => r.data),

  resetPassword: (id: string, data: ResetPasswordDto) =>
    api.patch<ApiResponse<User>>(`/users/${id}/reset-password`, data).then((r) => r.data),

  getProfile: () => api.get<ApiResponse<User>>("/users/me/profile").then((r) => r.data),

  updateProfile: (data: UpdateProfileDto) =>
    api.patch<ApiResponse<User>>("/users/me/profile", data).then((r) => r.data),

  changePassword: (data: ChangePasswordDto) =>
    api.patch<ApiResponse<null>>("/users/me/password", data).then((r) => r.data),
};
