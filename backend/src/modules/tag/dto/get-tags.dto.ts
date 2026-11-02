import { z } from 'zod';

export const GetTagsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
});

export type GetTagsDtoType = z.infer<typeof GetTagsDto>;
