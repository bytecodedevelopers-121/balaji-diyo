import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { CategoryType, CreateCategoryTypeDto, UpdateCategoryTypeDto } from "@/types/category-type";

export interface CategoryTypeListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export const categoryTypeService = {
  getAll: (params?: CategoryTypeListParams) =>
    api.get<ApiResponse<PaginatedResponse<CategoryType>>>("/category-types", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<CategoryType>>(`/category-types/${id}`).then((r) => r.data),

  create: (data: CreateCategoryTypeDto) =>
    api.post<ApiResponse<CategoryType>>("/category-types", data).then((r) => r.data),

  update: (id: string, data: UpdateCategoryTypeDto) =>
    api.patch<ApiResponse<CategoryType>>(`/category-types/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/category-types/${id}`).then((r) => r.data),
};
