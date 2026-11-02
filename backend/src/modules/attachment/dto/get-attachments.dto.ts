import { z } from 'zod';
import { AttachmentRole } from '@prisma/client';

export const GetAttachmentsDto = z.object({
  ownerType: z.string().min(1),
  ownerId: z.string().min(1),
  role: z.nativeEnum(AttachmentRole).optional(),
});

export type GetAttachmentsDtoType = z.infer<typeof GetAttachmentsDto>;
