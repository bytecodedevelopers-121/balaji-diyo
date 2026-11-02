import { z } from 'zod';

export const GetServicesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().trim().max(255).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetServicesDtoType = z.infer<typeof GetServicesDto>;
