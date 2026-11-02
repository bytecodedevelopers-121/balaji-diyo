import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { GroupFaq, CreateGroupFaqDto, UpdateGroupFaqDto } from "@/types/group-faq";

export interface GroupFaqListParams {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export const groupFaqService = {
  getAll: (params?: GroupFaqListParams) =>
    api.get<ApiResponse<PaginatedResponse<GroupFaq>>>("/group-faqs", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<GroupFaq>>(`/group-faqs/${id}`).then((r) => r.data),

  create: (data: CreateGroupFaqDto) => api.post<ApiResponse<GroupFaq>>("/group-faqs", data).then((r) => r.data),

  update: (id: string, data: UpdateGroupFaqDto) =>
    api.patch<ApiResponse<GroupFaq>>(`/group-faqs/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/group-faqs/${id}`).then((r) => r.data),
};
