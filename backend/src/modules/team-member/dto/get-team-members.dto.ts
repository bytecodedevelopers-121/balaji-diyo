import { z } from 'zod';

export const GetTeamMembersDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetTeamMembersDtoType = z.infer<typeof GetTeamMembersDto>;
