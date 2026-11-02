import { z } from 'zod';

export const GetBlogCommentsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  blogId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetBlogCommentsDtoType = z.infer<typeof GetBlogCommentsDto>;
