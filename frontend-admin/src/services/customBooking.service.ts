import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { CustomBooking } from "@/types/customBooking";

export interface CustomBookingListAdminParams {
  page?: number;
  perPage?: number;
  packageId?: string;
}

export const customBookingService = {
  getAll: (params?: CustomBookingListAdminParams) =>
    api.get<ApiResponse<PaginatedResponse<CustomBooking>>>("/custom-bookings", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<CustomBooking>>(`/custom-bookings/${id}`).then((r) => r.data),
};
