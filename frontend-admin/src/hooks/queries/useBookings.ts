import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { bookingService, type BookingListAdminParams } from "@/services/booking.service";
import type { CreateInvoiceDto } from "@/types/booking";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useBookings = (params?: BookingListAdminParams) =>
  useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => bookingService.getAll(params),
  });

export const useBooking = (id: string) =>
  useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
  });

export const useCreateInvoice = (bookingId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: CreateInvoiceDto) => bookingService.createInvoice(bookingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    },
  });
};

export const useDeleteBooking = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => bookingService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bookings.all }),
  });
};

export const useBulkDeleteBookings = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (ids: string[]) => bookingService.bulkRemove(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bookings.all }),
  });
};
