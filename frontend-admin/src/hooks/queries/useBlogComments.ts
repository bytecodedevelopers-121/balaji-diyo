import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { blogCommentService, type BlogCommentListParams } from "@/services/blog-comment.service";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useBlogComments = (params?: BlogCommentListParams) =>
  useQuery({
    queryKey: queryKeys.blogComments.list(params),
    queryFn: () => blogCommentService.getAll(params),
  });

export const useApproveBlogComment = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => blogCommentService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogComments.all }),
  });
};

export const useRejectBlogComment = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => blogCommentService.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogComments.all }),
  });
};

export const useDeleteBlogComment = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => blogCommentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogComments.all }),
  });
};
