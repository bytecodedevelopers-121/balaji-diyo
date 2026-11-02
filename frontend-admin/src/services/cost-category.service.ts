import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { CostCategory, CostCategoryFormValues, CostCategoryType } from "@/types/cost-category";

export interface CostCategoryListParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: CostCategoryType;
  isActive?: boolean;
}

export const costCategoryService = {
  getAll: (params?: CostCategoryListParams) =>
    api.get<ApiResponse<PaginatedResponse<CostCategory>>>("/cost-categories", { params }).then((r) => r.data),

  create: (data: CostCategoryFormValues) =>
    api.post<ApiResponse<CostCategory>>("/cost-categories", data).then((r) => r.data),

  update: (id: string, data: Partial<CostCategoryFormValues>) =>
    api.patch<ApiResponse<CostCategory>>(`/cost-categories/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/cost-categories/${id}`).then((r) => r.data),
};
