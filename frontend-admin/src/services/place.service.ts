import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Place, PlaceFormValues } from "@/types/place";

export interface PlaceListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export const placeService = {
  getAll: (params?: PlaceListParams) => api.get<ApiResponse<PaginatedResponse<Place>>>("/places", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Place>>(`/places/${id}`).then((r) => r.data),

  create: (data: PlaceFormValues) => api.post<ApiResponse<Place>>("/places", data).then((r) => r.data),

  update: (id: string, data: Partial<PlaceFormValues>) =>
    api.patch<ApiResponse<Place>>(`/places/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/places/${id}`).then((r) => r.data),
};
