import { z } from 'zod';

// Shared by every module's bulk-delete/bulk-restore endpoints.
export const BulkIdsDto = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one id is required').max(200),
});

export type BulkIdsDtoType = z.infer<typeof BulkIdsDto>;
