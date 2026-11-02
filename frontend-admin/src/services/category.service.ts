import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Category, CategoryTreeNode, CreateCategoryDto, UpdateCategoryDto } from "@/types/category";

export interface CategoryListParams {
  page?: number;
  perPage?: number;
  search?: string;
  typeId?: string;
  parentId?: string; // pass "root" to list only top-level categories
  isActive?: boolean;
  includeTrashed?: boolean;
  hasPackages?: boolean;
}

export const categoryService = {
  getAll: (params?: CategoryListParams) =>
    api.get<ApiResponse<PaginatedResponse<Category>>>("/categories", { params }).then((r) => r.data),

  getTree: (typeId: string) =>
    api.get<ApiResponse<CategoryTreeNode[]>>(`/categories/tree/${typeId}`).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`).then((r) => r.data),

  create: (data: CreateCategoryDto) =>
    api.post<ApiResponse<Category>>("/categories", data).then((r) => r.data),

  update: (id: string, data: UpdateCategoryDto) =>
    api.patch<ApiResponse<Category>>(`/categories/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/categories/${id}`).then((r) => r.data),

  restore: (id: string) => api.post<ApiResponse<null>>(`/categories/${id}/restore`).then((r) => r.data),

  hardDelete: (id: string) => api.delete<ApiResponse<null>>(`/categories/${id}/permanent`).then((r) => r.data),

  bulkRemove: (ids: string[]) =>
    api.post<ApiResponse<null>>("/categories/bulk/delete", { ids }).then((r) => r.data),
};
