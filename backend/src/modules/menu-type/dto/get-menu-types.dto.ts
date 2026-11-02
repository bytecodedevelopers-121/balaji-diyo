import { z } from 'zod';

export const GetMenuTypesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
});

export type GetMenuTypesDtoType = z.infer<typeof GetMenuTypesDto>;
