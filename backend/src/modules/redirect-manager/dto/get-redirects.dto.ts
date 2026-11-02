import { z } from 'zod';

export const GetRedirectsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
});

export type GetRedirectsDtoType = z.infer<typeof GetRedirectsDto>;
