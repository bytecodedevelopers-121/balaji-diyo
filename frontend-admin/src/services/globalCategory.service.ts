import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { GlobalCategory, CreateGlobalCategoryDto, UpdateGlobalCategoryDto } from "@/types/global-category";

export interface GlobalCategoryListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export const globalCategoryService = {
  getAll: (params?: GlobalCategoryListParams) =>
    api.get<ApiResponse<PaginatedResponse<GlobalCategory>>>("/global-categories", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<GlobalCategory>>(`/global-categories/${id}`).then((r) => r.data),

  create: (data: CreateGlobalCategoryDto) =>
    api.post<ApiResponse<GlobalCategory>>("/global-categories", data).then((r) => r.data),

  update: (id: string, data: UpdateGlobalCategoryDto) =>
    api.patch<ApiResponse<GlobalCategory>>(`/global-categories/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/global-categories/${id}`).then((r) => r.data),
};
