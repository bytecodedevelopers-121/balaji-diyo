import { z } from 'zod';

export const CreateBlogCommentDto = z.object({
  blogId: z.string().min(1),
  parentId: z.string().optional(),
  commentorName: z.string().min(3).max(255),
  commentorEmail: z.string().email().max(255).optional(),
  commentorAddress: z.string().max(255).optional(),
  commentorContact: z.string().max(50).optional(),
  comment: z.string().min(1),
});

export type CreateBlogCommentDtoType = z.infer<typeof CreateBlogCommentDto>;
