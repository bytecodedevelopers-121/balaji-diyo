import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Faq, CreateFaqDto, UpdateFaqDto } from "@/types/faq";

export interface FaqListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

export const faqService = {
  getAll: (params?: FaqListParams) => api.get<ApiResponse<PaginatedResponse<Faq>>>("/faqs", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Faq>>(`/faqs/${id}`).then((r) => r.data),

  create: (data: CreateFaqDto) => api.post<ApiResponse<Faq>>("/faqs", data).then((r) => r.data),

  update: (id: string, data: UpdateFaqDto) => api.patch<ApiResponse<Faq>>(`/faqs/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/faqs/${id}`).then((r) => r.data),
};
