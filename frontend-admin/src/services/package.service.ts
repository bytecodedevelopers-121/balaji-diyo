import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Package, PackageFormValues } from "@/types/package";

export interface PackageListParams {
  page?: number;
  perPage?: number;
  search?: string;
  destinationId?: string;
  gradeId?: string;
  styleId?: string;
  categoryId?: string;
  placeId?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
}

export interface PackageListAdminParams extends PackageListParams {
  isActive?: boolean;
  includeTrashed?: boolean;
}

export const packageService = {
  getAll: (params?: PackageListAdminParams) =>
    api.get<ApiResponse<PaginatedResponse<Package>>>("/packages/admin/all", { params }).then((r) => r.data),

  // Reorder mode needs the *complete* active list in one flat array (see
  // package.repository.ts's own `reorder` comment — array index becomes
  // the new sortOrder, so a partial page would silently drop the rest to
  // the front). The admin's own pagination caps `perPage` at 100 server
  // side, so this pages through everything and concatenates client side
  // rather than raising that cap just for this one screen.
  getAllForReorder: async (): Promise<Package[]> => {
    const perPage = 100;
    let page = 1;
    const items: Package[] = [];
    for (;;) {
      const res = await api.get<ApiResponse<PaginatedResponse<Package>>>("/packages/admin/all", {
        params: { page, perPage },
      });
      items.push(...res.data.data.items);
      if (page >= res.data.data.meta.totalPages) break;
      page += 1;
    }
    return items;
  },

  // Same "fetch every page, flatten client-side" shape as getAllForReorder,
  // but scoped to the independent `isPopular` pool (own flag, own
  // `popularSortOrder`) that drives the homepage's "Most Popular Journeys"
  // section — see reorderPopular below.
  getAllForReorderPopular: async (): Promise<Package[]> => {
    const perPage = 100;
    let page = 1;
    const items: Package[] = [];
    for (;;) {
      const res = await api.get<ApiResponse<PaginatedResponse<Package>>>("/packages/admin/all", {
        params: { page, perPage, isPopular: true },
      });
      items.push(...res.data.data.items);
      if (page >= res.data.data.meta.totalPages) break;
      page += 1;
    }
    return items;
  },

  getById: (id: string) => api.get<ApiResponse<Package>>(`/packages/admin/${id}`).then((r) => r.data),

  create: (data: PackageFormValues) => api.post<ApiResponse<Package>>("/packages", data).then((r) => r.data),

  update: (id: string, data: Partial<PackageFormValues>) =>
    api.patch<ApiResponse<Package>>(`/packages/${id}`, data).then((r) => r.data),

  reorder: (ids: string[]) => api.patch<ApiResponse<null>>("/packages/reorder", { ids }).then((r) => r.data),

  reorderPopular: (ids: string[]) =>
    api.patch<ApiResponse<null>>("/packages/reorder-popular", { ids }).then((r) => r.data),

  // Every non-trashed package tagged with the category (active or not), in
  // its current per-category order — the full set reorderInCategory needs.
  getAllInCategory: async (categoryId: string): Promise<Package[]> => {
    const perPage = 100;
    let page = 1;
    const items: Package[] = [];
    for (;;) {
      const res = await api.get<ApiResponse<PaginatedResponse<Package>>>("/packages/admin/all", {
        params: { page, perPage, categoryId },
      });
      items.push(...res.data.data.items);
      if (page >= res.data.data.meta.totalPages) return items;
      page += 1;
    }
  },

  reorderInCategory: (categoryId: string, ids: string[]) =>
    api.patch<ApiResponse<null>>(`/packages/category/${categoryId}/reorder`, { ids }).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/packages/${id}`).then((r) => r.data),

  restore: (id: string) => api.post<ApiResponse<null>>(`/packages/${id}/restore`).then((r) => r.data),

  hardDelete: (id: string) => api.delete<ApiResponse<null>>(`/packages/${id}/permanent`).then((r) => r.data),
};
