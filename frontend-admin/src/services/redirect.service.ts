import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Redirect, CreateRedirectDto, UpdateRedirectDto } from "@/types/redirect";

export interface RedirectListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

// Bulk create (/redirects/bulk) and bulk delete (/redirects/bulk/delete) exist
// on the backend for CSV-style imports but have no UI yet — deliberately out
// of v1 scope, single-row CRUD covers the admin workflow for now.
export const redirectService = {
  getAll: (params?: RedirectListParams) =>
    api.get<ApiResponse<PaginatedResponse<Redirect>>>("/redirects", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Redirect>>(`/redirects/${id}`).then((r) => r.data),

  create: (data: CreateRedirectDto) => api.post<ApiResponse<Redirect>>("/redirects", data).then((r) => r.data),

  update: (id: string, data: UpdateRedirectDto) =>
    api.patch<ApiResponse<Redirect>>(`/redirects/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/redirects/${id}`).then((r) => r.data),
};
