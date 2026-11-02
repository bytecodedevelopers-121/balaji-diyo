import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Testimonial, TestimonialFormValues } from "@/types/testimonial";

export interface TestimonialListParams {
  page?: number;
  perPage?: number;
  search?: string;
  packageId?: string;
  memberId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export const testimonialService = {
  getAll: (params?: TestimonialListParams) =>
    api.get<ApiResponse<PaginatedResponse<Testimonial>>>("/testimonials", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Testimonial>>(`/testimonials/${id}`).then((r) => r.data),

  create: (data: TestimonialFormValues) => api.post<ApiResponse<Testimonial>>("/testimonials", data).then((r) => r.data),

  update: (id: string, data: Partial<TestimonialFormValues>) =>
    api.patch<ApiResponse<Testimonial>>(`/testimonials/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/testimonials/${id}`).then((r) => r.data),
};
