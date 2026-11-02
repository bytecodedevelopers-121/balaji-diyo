import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Tag, CreateTagDto, UpdateTagDto } from "@/types/tag";

export interface TagListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export const tagService = {
  getAll: (params?: TagListParams) =>
    api.get<ApiResponse<PaginatedResponse<Tag>>>("/tags", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Tag>>(`/tags/${id}`).then((r) => r.data),

  create: (data: CreateTagDto) => api.post<ApiResponse<Tag>>("/tags", data).then((r) => r.data),

  update: (id: string, data: UpdateTagDto) =>
    api.patch<ApiResponse<Tag>>(`/tags/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/tags/${id}`).then((r) => r.data),
};
