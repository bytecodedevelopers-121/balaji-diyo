import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  Service,
  ServiceFormValues,
  ServiceSectionConfig,
  ServiceSectionConfigFormValues,
} from "@/types/service";

export interface ServiceListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

export const serviceService = {
  getSectionConfig: () =>
    api.get<ApiResponse<ServiceSectionConfig>>("/services/section-config").then((response) => response.data),
  updateSectionConfig: (data: ServiceSectionConfigFormValues) =>
    api.patch<ApiResponse<ServiceSectionConfig>>("/services/section-config", data).then((response) => response.data),
  getAll: (params?: ServiceListParams) =>
    api.get<ApiResponse<PaginatedResponse<Service>>>("/services", { params }).then((response) => response.data),
  getById: (id: string) => api.get<ApiResponse<Service>>(`/services/${id}`).then((response) => response.data),
  create: (data: ServiceFormValues) =>
    api.post<ApiResponse<Service>>("/services", data).then((response) => response.data),
  update: (id: string, data: Partial<ServiceFormValues>) =>
    api.patch<ApiResponse<Service>>(`/services/${id}`, data).then((response) => response.data),
  remove: (id: string) => api.delete<ApiResponse<null>>(`/services/${id}`).then((response) => response.data),
};
