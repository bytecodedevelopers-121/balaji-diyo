import { z } from 'zod';

export const GetMenuItemsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  typeId: z.string().optional(),
  parentId: z.string().optional(), // pass "root" to list only top-level items
  isActive: z.coerce.boolean().optional(),
});

export type GetMenuItemsDtoType = z.infer<typeof GetMenuItemsDto>;
