import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Booking, CreateInvoiceDto, Invoice } from "@/types/booking";

export interface BookingListAdminParams {
  page?: number;
  perPage?: number;
  search?: string;
  packageId?: string;
}

export const bookingService = {
  getAll: (params?: BookingListAdminParams) =>
    api.get<ApiResponse<PaginatedResponse<Booking>>>("/bookings", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<Booking>>(`/bookings/${id}`).then((r) => r.data),

  createInvoice: (id: string, data: CreateInvoiceDto) =>
    api.post<ApiResponse<Invoice>>(`/bookings/${id}/invoice`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/bookings/${id}`).then((r) => r.data),

  bulkRemove: (ids: string[]) =>
    api.post<ApiResponse<null>>("/bookings/bulk/delete", { ids }).then((r) => r.data),
};
