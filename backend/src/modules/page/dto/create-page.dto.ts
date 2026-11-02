import { z } from 'zod';

export const CreatePageDto = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1).optional(),
  content: z.string().optional(),
  pageOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

export type CreatePageDtoType = z.infer<typeof CreatePageDto>;
