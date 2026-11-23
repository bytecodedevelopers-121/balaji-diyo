import { z } from 'zod';

export const ListCatalogQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(100).optional(),
});
export type ListCatalogQueryDtoType = z.infer<typeof ListCatalogQueryDto>;

export const CatalogParamsDto = z.object({ id: z.string().min(1).max(64) });
