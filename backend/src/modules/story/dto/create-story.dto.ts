import { z } from 'zod';

export const CreateStoryDto = z.object({
  title: z.string().min(5).max(255),
  slug: z.string().min(1).optional(),
  abstract: z.string().max(255).optional(),
  content: z.string().min(1),
  storyDate: z.coerce.date(),
  isActive: z.boolean().optional(),

  authorIds: z.array(z.string()).max(5).optional(),

  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreateStoryDtoType = z.infer<typeof CreateStoryDto>;
