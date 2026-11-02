import { z } from 'zod';

export const GetFaqsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetFaqsDtoType = z.infer<typeof GetFaqsDto>;
