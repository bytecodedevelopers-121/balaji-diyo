import { z } from 'zod';

export const GetGlobalCategoriesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
});

export type GetGlobalCategoriesDtoType = z.infer<typeof GetGlobalCategoriesDto>;
