import { z } from 'zod';

export const GetContactMessagesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  isRead: z.coerce.boolean().optional(),
  /** Comma-separated inquiry types, e.g. `partner-brand,partner-creator`. */
  types: z.string().optional(),
});

export type GetContactMessagesDtoType = z.infer<typeof GetContactMessagesDto>;
