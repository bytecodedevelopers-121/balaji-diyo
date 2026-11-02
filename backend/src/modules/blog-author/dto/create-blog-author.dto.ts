import { z } from 'zod';

export const CreateBlogAuthorDto = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).optional(),
  salutation: z.string().max(15).optional(),
  email: z.string().email().max(255),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBlogAuthorDtoType = z.infer<typeof CreateBlogAuthorDto>;
