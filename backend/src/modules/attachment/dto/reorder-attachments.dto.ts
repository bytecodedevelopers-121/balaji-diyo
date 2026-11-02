import { z } from 'zod';

// `ids` is the full set of attachment ids for one (ownerType, ownerId, role)
// bucket, in the desired display order — sortOrder is rewritten to match
// each id's position in the array.
export const ReorderAttachmentsDto = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type ReorderAttachmentsDtoType = z.infer<typeof ReorderAttachmentsDto>;
