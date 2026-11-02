import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { customBookingService, type CustomBookingListAdminParams } from "@/services/customBooking.service";

export const useCustomBookings = (params?: CustomBookingListAdminParams) =>
  useQuery({
    queryKey: queryKeys.customBookings.list(params),
    queryFn: () => customBookingService.getAll(params),
  });

export const useCustomBooking = (id: string) =>
  useQuery({
    queryKey: queryKeys.customBookings.detail(id),
    queryFn: () => customBookingService.getById(id),
    enabled: !!id,
  });
