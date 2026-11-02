import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { userService } from "@/services/user.service";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import type { ChangePasswordDto, UpdateProfileDto } from "@/types/user";

export const useProfile = () =>
  useQuery({
    queryKey: queryKeys.me,
    queryFn: userService.getProfile,
    staleTime: 1000 * 60 * 5,
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateProfileDto) => userService.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
};

export const useChangePassword = () =>
  useSafeMutation({
    mutationFn: (data: ChangePasswordDto) => userService.changePassword(data),
  });
