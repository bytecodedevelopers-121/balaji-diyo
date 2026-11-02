import { z } from 'zod';

export const GetGroupFaqsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetGroupFaqsDtoType = z.infer<typeof GetGroupFaqsDto>;
