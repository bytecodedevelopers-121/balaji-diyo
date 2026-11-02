import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Story, StoryFormValues } from "@/types/story";

export interface StoryListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface StoryListAdminParams extends StoryListParams {
  isActive?: boolean;
  includeTrashed?: boolean;
}

export const storyService = {
  getAll: (params?: StoryListAdminParams) =>
    api.get<ApiResponse<PaginatedResponse<Story>>>("/stories/admin/all", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Story>>(`/stories/admin/${id}`).then((r) => r.data),

  create: (data: StoryFormValues) => api.post<ApiResponse<Story>>("/stories", data).then((r) => r.data),

  update: (id: string, data: Partial<StoryFormValues>) =>
    api.patch<ApiResponse<Story>>(`/stories/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/stories/${id}`).then((r) => r.data),

  restore: (id: string) => api.post<ApiResponse<null>>(`/stories/${id}/restore`).then((r) => r.data),

  hardDelete: (id: string) => api.delete<ApiResponse<null>>(`/stories/${id}/permanent`).then((r) => r.data),
};
