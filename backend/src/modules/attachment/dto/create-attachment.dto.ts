import { z } from 'zod';
import { AttachmentRole } from '@prisma/client';

export const CreateAttachmentDto = z.object({
  mediaId: z.string().min(1),
  ownerType: z.string().min(1).max(50),
  ownerId: z.string().min(1),
  role: z.nativeEnum(AttachmentRole),
  reelUrl: z.string().max(500).optional(),
  shortDescription: z.string().optional(),
  contentUrl: z.string().max(500).optional(),
  isFeatured: z.boolean().optional(),
});

export type CreateAttachmentDtoType = z.infer<typeof CreateAttachmentDto>;
