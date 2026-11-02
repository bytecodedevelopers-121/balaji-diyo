import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { blogAuthorService, type BlogAuthorListParams } from "@/services/blog-author.service";
import type { UpdateBlogAuthorDto } from "@/types/blog-author";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useBlogAuthors = (params?: BlogAuthorListParams) =>
  useQuery({
    queryKey: queryKeys.blogAuthors.list(params),
    queryFn: () => blogAuthorService.getAll(params),
  });

export const useCreateBlogAuthor = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: blogAuthorService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogAuthors.all }),
  });
};

export const useUpdateBlogAuthor = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateBlogAuthorDto) => blogAuthorService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogAuthors.all }),
  });
};

export const useDeleteBlogAuthor = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => blogAuthorService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogAuthors.all }),
  });
};
