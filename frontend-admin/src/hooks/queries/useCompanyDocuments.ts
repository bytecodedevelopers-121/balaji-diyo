import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { companyDocumentService, type CompanyDocumentListParams } from "@/services/company-document.service";
import type { CompanyDocumentFormValues } from "@/types/company-document";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useCompanyDocuments = (params?: CompanyDocumentListParams) =>
  useQuery({
    queryKey: queryKeys.companyDocuments.list(params),
    queryFn: () => companyDocumentService.getAll(params),
  });

export const useCompanyDocument = (id: string) =>
  useQuery({
    queryKey: queryKeys.companyDocuments.detail(id),
    queryFn: () => companyDocumentService.getById(id),
    enabled: !!id,
  });

export const useCreateCompanyDocument = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: companyDocumentService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.companyDocuments.all }),
  });
};

export const useUpdateCompanyDocument = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<CompanyDocumentFormValues>) => companyDocumentService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companyDocuments.all });
      qc.invalidateQueries({ queryKey: queryKeys.companyDocuments.detail(id) });
    },
  });
};

export const useDeleteCompanyDocument = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => companyDocumentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.companyDocuments.all }),
  });
};
