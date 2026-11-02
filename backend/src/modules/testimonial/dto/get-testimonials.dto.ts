import { z } from 'zod';

export const GetTestimonialsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  packageId: z.string().optional(),
  memberId: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetTestimonialsDtoType = z.infer<typeof GetTestimonialsDto>;
