import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { paymentService, type PaymentListAdminParams } from "@/services/payment.service";
import type { CreatePaymentDto, UpdatePaymentStatusDto } from "@/types/payment";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const usePayments = (params?: PaymentListAdminParams) =>
  useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => paymentService.getAll(params),
  });

export const usePayment = (id: string) =>
  useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => paymentService.getById(id),
    enabled: !!id,
  });

export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: CreatePaymentDto) => paymentService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payments.all }),
  });
};

export const useUpdatePaymentStatus = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdatePaymentStatusDto) => paymentService.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
      qc.invalidateQueries({ queryKey: queryKeys.payments.detail(id) });
    },
  });
};

export const useDeletePayment = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => paymentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payments.all }),
  });
};

export const useRestorePayment = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => paymentService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payments.all }),
  });
};

export const useHardDeletePayment = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => paymentService.hardDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payments.all }),
  });
};
