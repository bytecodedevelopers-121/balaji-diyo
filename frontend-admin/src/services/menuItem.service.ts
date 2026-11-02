import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { MenuItem, MenuItemTreeNode, CreateMenuItemDto, UpdateMenuItemDto } from "@/types/menu-item";

export interface MenuItemListParams {
  page?: number;
  perPage?: number;
  typeId?: string;
  parentId?: string; // pass "root" to list only top-level items
  isActive?: boolean;
}

export const menuItemService = {
  getAll: (params?: MenuItemListParams) =>
    api.get<ApiResponse<PaginatedResponse<MenuItem>>>("/menu-items", { params }).then((r) => r.data),

  getTree: (typeId: string) =>
    api.get<ApiResponse<MenuItemTreeNode[]>>(`/menu-items/tree/${typeId}`).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<MenuItem>>(`/menu-items/${id}`).then((r) => r.data),

  create: (data: CreateMenuItemDto) => api.post<ApiResponse<MenuItem>>("/menu-items", data).then((r) => r.data),

  update: (id: string, data: UpdateMenuItemDto) =>
    api.patch<ApiResponse<MenuItem>>(`/menu-items/${id}`, data).then((r) => r.data),

  // Full sibling group in its new display order — see backend
  // MenuItemService.reorder (rejects anything but the complete set).
  reorder: (data: { typeId: string; parentId: string | null; ids: string[] }) =>
    api.patch<ApiResponse<null>>("/menu-items/reorder", data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/menu-items/${id}`).then((r) => r.data),
};
