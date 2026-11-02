import { z } from 'zod';

export const GetBlogAuthorsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetBlogAuthorsDtoType = z.infer<typeof GetBlogAuthorsDto>;
