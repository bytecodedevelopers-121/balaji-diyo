import { z } from 'zod';

export const GetContactMessagesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  isRead: z.coerce.boolean().optional(),
});

export type GetContactMessagesDtoType = z.infer<typeof GetContactMessagesDto>;
