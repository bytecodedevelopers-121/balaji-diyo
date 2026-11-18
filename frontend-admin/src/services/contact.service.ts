import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { ContactMessage } from "@/types/contact";

export interface ContactListAdminParams {
  page?: number;
  perPage?: number;
  search?: string;
  isRead?: boolean;
  /** Comma-separated inquiry types. */
  types?: string;
}

export const contactService = {
  getAll: (params?: ContactListAdminParams) =>
    api.get<ApiResponse<PaginatedResponse<ContactMessage>>>("/contacts", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<ContactMessage>>(`/contacts/${id}`).then((r) => r.data),

  markRead: (id: string) => api.patch<ApiResponse<ContactMessage>>(`/contacts/${id}/read`).then((r) => r.data),

  markUnread: (id: string) => api.patch<ApiResponse<ContactMessage>>(`/contacts/${id}/unread`).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/contacts/${id}`).then((r) => r.data),

  bulkRemove: (ids: string[]) =>
    api.post<ApiResponse<null>>("/contacts/bulk/delete", { ids }).then((r) => r.data),
};
