import { z } from 'zod';

export const GetCategoryTypesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
});

export type GetCategoryTypesDtoType = z.infer<typeof GetCategoryTypesDto>;
