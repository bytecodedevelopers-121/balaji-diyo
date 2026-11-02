import { z } from 'zod';

export const GetStoryAuthorsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetStoryAuthorsDtoType = z.infer<typeof GetStoryAuthorsDto>;
