import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { faqService, type FaqListParams } from "@/services/faq.service";
import type { UpdateFaqDto } from "@/types/faq";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useFaqs = (params?: FaqListParams) =>
  useQuery({
    queryKey: queryKeys.faqs.list(params),
    queryFn: () => faqService.getAll(params),
  });

export const useCreateFaq = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: faqService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
};

export const useUpdateFaq = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateFaqDto) => faqService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
};

export const useDeleteFaq = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => faqService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
};
