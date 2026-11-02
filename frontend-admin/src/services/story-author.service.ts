import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { StoryAuthor, CreateStoryAuthorDto, UpdateStoryAuthorDto } from "@/types/story-author";

export interface StoryAuthorListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

export const storyAuthorService = {
  getAll: (params?: StoryAuthorListParams) =>
    api.get<ApiResponse<PaginatedResponse<StoryAuthor>>>("/story-authors", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<StoryAuthor>>(`/story-authors/${id}`).then((r) => r.data),

  create: (data: CreateStoryAuthorDto) =>
    api.post<ApiResponse<StoryAuthor>>("/story-authors", data).then((r) => r.data),

  update: (id: string, data: UpdateStoryAuthorDto) =>
    api.patch<ApiResponse<StoryAuthor>>(`/story-authors/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/story-authors/${id}`).then((r) => r.data),
};
