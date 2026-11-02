import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { CompanyDocument, CompanyDocumentFormValues } from "@/types/company-document";

export interface CompanyDocumentListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

export const companyDocumentService = {
  getAll: (params?: CompanyDocumentListParams) =>
    api.get<ApiResponse<PaginatedResponse<CompanyDocument>>>("/company-documents", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<CompanyDocument>>(`/company-documents/${id}`).then((r) => r.data),

  create: (data: CompanyDocumentFormValues) =>
    api.post<ApiResponse<CompanyDocument>>("/company-documents", data).then((r) => r.data),

  update: (id: string, data: Partial<CompanyDocumentFormValues>) =>
    api.patch<ApiResponse<CompanyDocument>>(`/company-documents/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/company-documents/${id}`).then((r) => r.data),
};
