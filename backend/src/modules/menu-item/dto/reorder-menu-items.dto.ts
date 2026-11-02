import { z } from 'zod';

// Whole-sibling-group-in-display-order convention (same as
// ReorderPackagesDto): `ids` must be *every* live child of `parentId`
// (null = top-level items of `typeId`), since array index becomes each
// one's new `itemOrder` — see MenuItemService.reorder.
export const ReorderMenuItemsDto = z.object({
  typeId: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  ids: z.array(z.string().min(1)).min(1),
});

export type ReorderMenuItemsDtoType = z.infer<typeof ReorderMenuItemsDto>;
