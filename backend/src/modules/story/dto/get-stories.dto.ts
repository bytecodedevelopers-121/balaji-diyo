import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

export const GetStoriesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  authorId: z.string().optional(),
});

export type GetStoriesDtoType = z.infer<typeof GetStoriesDto>;

export const GetStoriesAdminDto = GetStoriesDto.extend({
  isActive: z.coerce.boolean().optional(),
  includeTrashed: booleanQueryParam,
});

export type GetStoriesAdminDtoType = z.infer<typeof GetStoriesAdminDto>;
