import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { teamMemberService, type TeamMemberListParams } from "@/services/team-member.service";
import type { TeamMemberFormValues } from "@/types/team-member";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useTeamMembers = (params?: TeamMemberListParams) =>
  useQuery({
    queryKey: queryKeys.teamMembers.list(params),
    queryFn: () => teamMemberService.getAll(params),
  });

export const useTeamMember = (id: string) =>
  useQuery({
    queryKey: queryKeys.teamMembers.detail(id),
    queryFn: () => teamMemberService.getById(id),
    enabled: !!id,
  });

export const useCreateTeamMember = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: teamMemberService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teamMembers.all }),
  });
};

export const useUpdateTeamMember = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<TeamMemberFormValues>) => teamMemberService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamMembers.all });
      qc.invalidateQueries({ queryKey: queryKeys.teamMembers.detail(id) });
    },
  });
};

export const useDeleteTeamMember = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => teamMemberService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teamMembers.all }),
  });
};
