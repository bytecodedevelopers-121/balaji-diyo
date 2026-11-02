import { z } from 'zod';

export const CreateCostCategoryDto = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['INCLUDE', 'EXCLUDE']),
  icon: z.string().max(50).nullish(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCostCategoryDtoType = z.infer<typeof CreateCostCategoryDto>;
