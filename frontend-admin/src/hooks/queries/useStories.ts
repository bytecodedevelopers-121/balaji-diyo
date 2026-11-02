import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { storyService, type StoryListAdminParams } from "@/services/story.service";
import type { StoryFormValues } from "@/types/story";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useStories = (params?: StoryListAdminParams) =>
  useQuery({
    queryKey: queryKeys.stories.adminList(params),
    queryFn: () => storyService.getAll(params),
  });

export const useStory = (id: string) =>
  useQuery({
    queryKey: queryKeys.stories.detail(id),
    queryFn: () => storyService.getById(id),
    enabled: !!id,
  });

export const useCreateStory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: storyService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.stories.all }),
  });
};

export const useUpdateStory = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<StoryFormValues>) => storyService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stories.all });
      qc.invalidateQueries({ queryKey: queryKeys.stories.detail(id) });
    },
  });
};

export const useDeleteStory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => storyService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.stories.all }),
  });
};

export const useRestoreStory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => storyService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.stories.all }),
  });
};

export const useHardDeleteStory = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => storyService.hardDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.stories.all }),
  });
};
