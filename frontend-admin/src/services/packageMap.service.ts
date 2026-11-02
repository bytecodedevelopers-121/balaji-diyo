import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { PackageMap, CreatePackageMapDto, UpdatePackageMapDto } from "@/types/package-map";

export interface PackageMapListParams {
  page?: number;
  perPage?: number;
  packageId?: string;
  search?: string;
  isActive?: boolean;
  includeTrashed?: boolean;
}

export const packageMapService = {
  getAll: (params?: PackageMapListParams) =>
    api.get<ApiResponse<PaginatedResponse<PackageMap>>>("/package-maps", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<PackageMap>>(`/package-maps/${id}`).then((r) => r.data),

  create: (data: CreatePackageMapDto) => api.post<ApiResponse<PackageMap>>("/package-maps", data).then((r) => r.data),

  update: (id: string, data: UpdatePackageMapDto) =>
    api.patch<ApiResponse<PackageMap>>(`/package-maps/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/package-maps/${id}`).then((r) => r.data),

  restore: (id: string) => api.post<ApiResponse<null>>(`/package-maps/${id}/restore`).then((r) => r.data),

  hardDelete: (id: string) => api.delete<ApiResponse<null>>(`/package-maps/${id}/permanent`).then((r) => r.data),
};
