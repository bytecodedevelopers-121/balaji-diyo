import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { pageService, type PageListAdminParams } from "@/services/page.service";
import type { PageFormValues } from "@/types/page";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const usePages = (params?: PageListAdminParams) =>
  useQuery({
    queryKey: queryKeys.pages.adminList(params),
    queryFn: () => pageService.getAll(params),
  });

export const usePage = (id: string) =>
  useQuery({
    queryKey: queryKeys.pages.detail(id),
    queryFn: () => pageService.getById(id),
    enabled: !!id,
  });

export const useCreatePage = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: pageService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pages.all }),
  });
};

export const useUpdatePage = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<PageFormValues>) => pageService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pages.all });
      qc.invalidateQueries({ queryKey: queryKeys.pages.detail(id) });
    },
  });
};

export const useDeletePage = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => pageService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pages.all }),
  });
};

export const useRestorePage = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => pageService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pages.all }),
  });
};

export const useHardDeletePage = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => pageService.hardDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pages.all }),
  });
};
