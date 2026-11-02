import { z } from 'zod';

export const CreateCategoryDto = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  extraField1: z.string().optional(),
  categoryOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  typeId: z.string().min(1, 'typeId is required'),
  parentId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

export type CreateCategoryDtoType = z.infer<typeof CreateCategoryDto>;
