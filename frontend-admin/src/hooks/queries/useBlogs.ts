import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { blogService, type BlogListAdminParams } from "@/services/blog.service";
import type { BlogFormValues } from "@/types/blog";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useBlogs = (params?: BlogListAdminParams) =>
  useQuery({
    queryKey: queryKeys.blogs.adminList(params),
    queryFn: () => blogService.getAll(params),
  });

export const useBlog = (id: string) =>
  useQuery({
    queryKey: queryKeys.blogs.detail(id),
    queryFn: () => blogService.getById(id),
    enabled: !!id,
  });

export const useCreateBlog = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: blogService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogs.all }),
  });
};

export const useUpdateBlog = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<BlogFormValues>) => blogService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.blogs.all });
      qc.invalidateQueries({ queryKey: queryKeys.blogs.detail(id) });
    },
  });
};

export const useDeleteBlog = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => blogService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogs.all }),
  });
};

export const useRestoreBlog = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => blogService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogs.all }),
  });
};

export const useHardDeleteBlog = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => blogService.hardDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blogs.all }),
  });
};
