import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { testimonialService, type TestimonialListParams } from "@/services/testimonial.service";
import type { TestimonialFormValues } from "@/types/testimonial";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useTestimonials = (params?: TestimonialListParams) =>
  useQuery({
    queryKey: queryKeys.testimonials.list(params),
    queryFn: () => testimonialService.getAll(params),
  });

export const useTestimonial = (id: string) =>
  useQuery({
    queryKey: queryKeys.testimonials.detail(id),
    queryFn: () => testimonialService.getById(id),
    enabled: !!id,
  });

export const useCreateTestimonial = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: testimonialService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.testimonials.all }),
  });
};

export const useUpdateTestimonial = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<TestimonialFormValues>) => testimonialService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.testimonials.all });
      qc.invalidateQueries({ queryKey: queryKeys.testimonials.detail(id) });
    },
  });
};

export const useDeleteTestimonial = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => testimonialService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.testimonials.all }),
  });
};
