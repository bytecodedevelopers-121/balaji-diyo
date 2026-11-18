import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Departure, CreateDepartureDto, CreateDeparturesBulkDto, UpdateDepartureDto } from "@/types/departure";

export interface DepartureListParams {
  page?: number;
  perPage?: number;
  packageId?: string;
  departureStatus?: string;
  lastMinute?: boolean;
}

export const departureService = {
  getAll: (params?: DepartureListParams) =>
    api.get<ApiResponse<PaginatedResponse<Departure>>>("/departures", { params }).then((r) => r.data),

  create: (data: CreateDepartureDto) => api.post<ApiResponse<Departure>>("/departures", data).then((r) => r.data),

  createBulk: (data: CreateDeparturesBulkDto) =>
    api.post<ApiResponse<Departure[]>>("/departures/bulk", data).then((r) => r.data),

  update: (id: string, data: UpdateDepartureDto) =>
    api.patch<ApiResponse<Departure>>(`/departures/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/departures/${id}`).then((r) => r.data),
};
