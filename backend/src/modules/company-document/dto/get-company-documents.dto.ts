import { z } from 'zod';

export const GetCompanyDocumentsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  category: z.enum(['legal', 'association']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetCompanyDocumentsDtoType = z.infer<typeof GetCompanyDocumentsDto>;
