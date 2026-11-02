import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Page, PageFormValues } from "@/types/page";

export interface PageListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface PageListAdminParams extends PageListParams {
  isActive?: boolean;
  includeTrashed?: boolean;
}

export const pageService = {
  getAll: (params?: PageListAdminParams) =>
    api.get<ApiResponse<PaginatedResponse<Page>>>("/pages/admin/all", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Page>>(`/pages/admin/${id}`).then((r) => r.data),

  create: (data: PageFormValues) => api.post<ApiResponse<Page>>("/pages", data).then((r) => r.data),

  update: (id: string, data: Partial<PageFormValues>) =>
    api.patch<ApiResponse<Page>>(`/pages/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/pages/${id}`).then((r) => r.data),

  restore: (id: string) => api.post<ApiResponse<null>>(`/pages/${id}/restore`).then((r) => r.data),

  hardDelete: (id: string) => api.delete<ApiResponse<null>>(`/pages/${id}/permanent`).then((r) => r.data),
};
