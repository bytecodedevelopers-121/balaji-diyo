import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { BlogAuthor, CreateBlogAuthorDto, UpdateBlogAuthorDto } from "@/types/blog-author";

export interface BlogAuthorListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

export const blogAuthorService = {
  getAll: (params?: BlogAuthorListParams) =>
    api.get<ApiResponse<PaginatedResponse<BlogAuthor>>>("/blog-authors", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<BlogAuthor>>(`/blog-authors/${id}`).then((r) => r.data),

  create: (data: CreateBlogAuthorDto) =>
    api.post<ApiResponse<BlogAuthor>>("/blog-authors", data).then((r) => r.data),

  update: (id: string, data: UpdateBlogAuthorDto) =>
    api.patch<ApiResponse<BlogAuthor>>(`/blog-authors/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/blog-authors/${id}`).then((r) => r.data),
};
