import { z } from 'zod';

export const GetPlacesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  regionId: z.string().optional(),
  placeTypeId: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetPlacesDtoType = z.infer<typeof GetPlacesDto>;
