import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { storyAuthorService, type StoryAuthorListParams } from "@/services/story-author.service";
import type { UpdateStoryAuthorDto } from "@/types/story-author";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useStoryAuthors = (params?: StoryAuthorListParams) =>
  useQuery({
    queryKey: queryKeys.storyAuthors.list(params),
    queryFn: () => storyAuthorService.getAll(params),
  });

export const useCreateStoryAuthor = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: storyAuthorService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.storyAuthors.all }),
  });
};

export const useUpdateStoryAuthor = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateStoryAuthorDto) => storyAuthorService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.storyAuthors.all }),
  });
};

export const useDeleteStoryAuthor = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => storyAuthorService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.storyAuthors.all }),
  });
};
