import { z } from 'zod';

export const GetTripInfosDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetTripInfosDtoType = z.infer<typeof GetTripInfosDto>;
