import { z } from 'zod';

export const CreateCompanyDocumentDto = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  category: z.enum(['legal', 'association']).optional(),
  sortOrder: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCompanyDocumentDtoType = z.infer<typeof CreateCompanyDocumentDto>;
