import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentStatusDto,
  PaymentGateway,
  PaymentStatus,
} from "@/types/payment";

export interface PaymentListAdminParams {
  page?: number;
  perPage?: number;
  packageId?: string;
  gateway?: PaymentGateway;
  status?: PaymentStatus;
  includeTrashed?: boolean;
}

export const paymentService = {
  getAll: (params?: PaymentListAdminParams) =>
    api.get<ApiResponse<PaginatedResponse<Payment>>>("/payments", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Payment>>(`/payments/${id}`).then((r) => r.data),

  create: (data: CreatePaymentDto) => api.post<ApiResponse<Payment>>("/payments", data).then((r) => r.data),

  updateStatus: (id: string, data: UpdatePaymentStatusDto) =>
    api.patch<ApiResponse<Payment>>(`/payments/${id}/status`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/payments/${id}`).then((r) => r.data),

  restore: (id: string) => api.post<ApiResponse<null>>(`/payments/${id}/restore`).then((r) => r.data),

  hardDelete: (id: string) => api.delete<ApiResponse<null>>(`/payments/${id}/permanent`).then((r) => r.data),
};
