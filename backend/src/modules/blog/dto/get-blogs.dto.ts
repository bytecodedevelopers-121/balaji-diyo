import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

export const GetBlogsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  authorId: z.string().optional(),
});

export type GetBlogsDtoType = z.infer<typeof GetBlogsDto>;

export const GetBlogsAdminDto = GetBlogsDto.extend({
  isActive: z.coerce.boolean().optional(),
  includeTrashed: booleanQueryParam,
});

export type GetBlogsAdminDtoType = z.infer<typeof GetBlogsAdminDto>;
