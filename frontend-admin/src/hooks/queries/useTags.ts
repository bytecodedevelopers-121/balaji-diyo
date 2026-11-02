import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { tagService, type TagListParams } from "@/services/tag.service";
import type { UpdateTagDto } from "@/types/tag";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useTags = (params?: TagListParams) =>
  useQuery({
    queryKey: queryKeys.tags.list(params),
    queryFn: () => tagService.getAll(params),
  });

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: tagService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tags.all }),
  });
};

export const useUpdateTag = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateTagDto) => tagService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tags.all }),
  });
};

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => tagService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tags.all }),
  });
};
