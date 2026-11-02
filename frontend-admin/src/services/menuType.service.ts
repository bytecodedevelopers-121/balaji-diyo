import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { MenuType, CreateMenuTypeDto, UpdateMenuTypeDto } from "@/types/menu-type";

export interface MenuTypeListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export const menuTypeService = {
  getAll: (params?: MenuTypeListParams) =>
    api.get<ApiResponse<PaginatedResponse<MenuType>>>("/menu-types", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<MenuType>>(`/menu-types/${id}`).then((r) => r.data),

  create: (data: CreateMenuTypeDto) => api.post<ApiResponse<MenuType>>("/menu-types", data).then((r) => r.data),

  update: (id: string, data: UpdateMenuTypeDto) =>
    api.patch<ApiResponse<MenuType>>(`/menu-types/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/menu-types/${id}`).then((r) => r.data),
};
