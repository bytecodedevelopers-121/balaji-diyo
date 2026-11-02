import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { redirectService, type RedirectListParams } from "@/services/redirect.service";
import type { UpdateRedirectDto } from "@/types/redirect";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useRedirects = (params?: RedirectListParams) =>
  useQuery({
    queryKey: queryKeys.redirects.list(params),
    queryFn: () => redirectService.getAll(params),
  });

export const useCreateRedirect = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: redirectService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.redirects.all }),
  });
};

export const useUpdateRedirect = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateRedirectDto) => redirectService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.redirects.all }),
  });
};

export const useDeleteRedirect = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => redirectService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.redirects.all }),
  });
};
