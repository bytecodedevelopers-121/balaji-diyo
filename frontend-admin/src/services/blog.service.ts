import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Blog, BlogFormValues } from "@/types/blog";

export interface BlogListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface BlogListAdminParams extends BlogListParams {
  isActive?: boolean;
  includeTrashed?: boolean;
}

export const blogService = {
  getAll: (params?: BlogListAdminParams) =>
    api.get<ApiResponse<PaginatedResponse<Blog>>>("/blogs/admin/all", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Blog>>(`/blogs/admin/${id}`).then((r) => r.data),

  create: (data: BlogFormValues) => api.post<ApiResponse<Blog>>("/blogs", data).then((r) => r.data),

  update: (id: string, data: Partial<BlogFormValues>) =>
    api.patch<ApiResponse<Blog>>(`/blogs/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/blogs/${id}`).then((r) => r.data),

  restore: (id: string) => api.post<ApiResponse<null>>(`/blogs/${id}/restore`).then((r) => r.data),

  hardDelete: (id: string) => api.delete<ApiResponse<null>>(`/blogs/${id}/permanent`).then((r) => r.data),
};
