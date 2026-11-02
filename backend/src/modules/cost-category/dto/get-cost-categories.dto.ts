import { z } from 'zod';

export const GetCostCategoriesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(['INCLUDE', 'EXCLUDE']).optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export type GetCostCategoriesDtoType = z.infer<typeof GetCostCategoriesDto>;
