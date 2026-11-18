import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

export const GetCategoriesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  typeId: z.string().optional(),
  // Pass "root" to list only top-level categories.
  parentId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  includeTrashed: booleanQueryParam,
  // Only categories with at least one non-trashed package tagged — the
  // admin's "which category pages can I reorder" filter.
  hasPackages: booleanQueryParam,
  // Exact match on the free-form marker field (e.g. "tour-type" for admin-created tour types).
  extraField1: z.string().optional(),
});

export type GetCategoriesDtoType = z.infer<typeof GetCategoriesDto>;
