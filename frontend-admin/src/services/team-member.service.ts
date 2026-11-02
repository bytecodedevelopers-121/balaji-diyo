import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { TeamMember, TeamMemberFormValues } from "@/types/team-member";

export interface TeamMemberListParams {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export const teamMemberService = {
  getAll: (params?: TeamMemberListParams) =>
    api.get<ApiResponse<PaginatedResponse<TeamMember>>>("/team-members", { params }).then((r) => r.data),

  getById: (id: string) => api.get<ApiResponse<TeamMember>>(`/team-members/${id}`).then((r) => r.data),

  create: (data: TeamMemberFormValues) => api.post<ApiResponse<TeamMember>>("/team-members", data).then((r) => r.data),

  update: (id: string, data: Partial<TeamMemberFormValues>) =>
    api.patch<ApiResponse<TeamMember>>(`/team-members/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/team-members/${id}`).then((r) => r.data),
};
