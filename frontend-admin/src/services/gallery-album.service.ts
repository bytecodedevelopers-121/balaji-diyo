import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { GalleryAlbum, GalleryAlbumFormValues } from "@/types/gallery-album";

export interface GalleryAlbumListParams {
  page?: number;
  perPage?: number;
  search?: string;
  destinationId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export const galleryAlbumService = {
  getAll: (params?: GalleryAlbumListParams) =>
    api.get<ApiResponse<PaginatedResponse<GalleryAlbum>>>("/gallery-albums", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<GalleryAlbum>>(`/gallery-albums/${id}`).then((r) => r.data),

  create: (data: GalleryAlbumFormValues) =>
    api.post<ApiResponse<GalleryAlbum>>("/gallery-albums", data).then((r) => r.data),

  update: (id: string, data: Partial<GalleryAlbumFormValues>) =>
    api.patch<ApiResponse<GalleryAlbum>>(`/gallery-albums/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/gallery-albums/${id}`).then((r) => r.data),
};
