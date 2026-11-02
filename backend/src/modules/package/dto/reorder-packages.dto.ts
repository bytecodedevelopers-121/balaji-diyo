import { z } from 'zod';

// Whole-array-in-display-order convention (see PackageRepository.reorder) —
// `ids` must be every active package's id, not a partial page/filter, since
// array index becomes the new `sortOrder` for each one.
export const ReorderPackagesDto = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type ReorderPackagesDtoType = z.infer<typeof ReorderPackagesDto>;
