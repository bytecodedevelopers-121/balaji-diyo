import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Media, UpdateMediaDto } from "@/types/media";

export interface MediaListParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** Restricts the browse grid to just this type — see GetMediaDto (backend) for why. */
  type?: "image" | "video";
}

export const mediaService = {
  getAll: (params?: MediaListParams) =>
    api.get<ApiResponse<PaginatedResponse<Media>>>("/media", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Media>>(`/media/${id}`).then((r) => r.data),

  upload: (
    file: File,
    altText: string | undefined,
    onProgress?: (percent: number) => void,
    folder?: string,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    if (altText) formData.append("altText", altText);
    if (folder) formData.append("folder", folder);

    return api
      .post<ApiResponse<Media>>("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total && onProgress) {
            onProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
      })
      .then((r) => r.data);
  },

  update: (id: string, data: UpdateMediaDto) =>
    api.patch<ApiResponse<Media>>(`/media/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/media/${id}`).then((r) => r.data),
};
