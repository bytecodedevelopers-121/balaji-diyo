import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { TripInfo, CreateTripInfoDto, UpdateTripInfoDto } from "@/types/trip-info";

export interface TripInfoListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

export const tripInfoService = {
  getAll: (params?: TripInfoListParams) =>
    api.get<ApiResponse<PaginatedResponse<TripInfo>>>("/trip-infos", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<TripInfo>>(`/trip-infos/${id}`).then((r) => r.data),

  create: (data: CreateTripInfoDto) => api.post<ApiResponse<TripInfo>>("/trip-infos", data).then((r) => r.data),

  update: (id: string, data: UpdateTripInfoDto) =>
    api.patch<ApiResponse<TripInfo>>(`/trip-infos/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/trip-infos/${id}`).then((r) => r.data),
};
