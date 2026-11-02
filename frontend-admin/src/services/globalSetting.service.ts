import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { GlobalSetting, CreateGlobalSettingDto, UpdateGlobalSettingDto } from "@/types/global-setting";

export interface GlobalSettingListParams {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: string;
  keyGroup?: string;
  isActive?: boolean;
}

export const globalSettingService = {
  getAll: (params?: GlobalSettingListParams) =>
    api.get<ApiResponse<PaginatedResponse<GlobalSetting>>>("/global-settings", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<GlobalSetting>>(`/global-settings/${id}`).then((r) => r.data),

  create: (data: CreateGlobalSettingDto) =>
    api.post<ApiResponse<GlobalSetting>>("/global-settings", data).then((r) => r.data),

  update: (id: string, data: UpdateGlobalSettingDto) =>
    api.patch<ApiResponse<GlobalSetting>>(`/global-settings/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/global-settings/${id}`).then((r) => r.data),
};
