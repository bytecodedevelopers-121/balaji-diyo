import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { groupFaqService, type GroupFaqListParams } from "@/services/group-faq.service";
import type { UpdateGroupFaqDto } from "@/types/group-faq";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useGroupFaqs = (params?: GroupFaqListParams) =>
  useQuery({
    queryKey: queryKeys.groupFaqs.list(params),
    queryFn: () => groupFaqService.getAll(params),
  });

export const useCreateGroupFaq = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: groupFaqService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.groupFaqs.all }),
  });
};

export const useUpdateGroupFaq = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateGroupFaqDto) => groupFaqService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.groupFaqs.all }),
  });
};

export const useDeleteGroupFaq = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => groupFaqService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.groupFaqs.all }),
  });
};
