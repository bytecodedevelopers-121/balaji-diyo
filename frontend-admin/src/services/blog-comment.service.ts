import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { BlogComment } from "@/types/blog-comment";

export interface BlogCommentListParams {
  page?: number;
  perPage?: number;
  blogId?: string;
  isActive?: boolean;
}

export const blogCommentService = {
  getAll: (params?: BlogCommentListParams) =>
    api.get<ApiResponse<PaginatedResponse<BlogComment>>>("/blog-comments", { params }).then((r) => r.data),

  approve: (id: string) => api.patch<ApiResponse<BlogComment>>(`/blog-comments/${id}/approve`).then((r) => r.data),

  reject: (id: string) => api.patch<ApiResponse<BlogComment>>(`/blog-comments/${id}/reject`).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/blog-comments/${id}`).then((r) => r.data),
};
