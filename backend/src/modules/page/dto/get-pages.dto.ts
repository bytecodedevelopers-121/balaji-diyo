import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

export const GetPagesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
});

export type GetPagesDtoType = z.infer<typeof GetPagesDto>;

export const GetPagesAdminDto = GetPagesDto.extend({
  isActive: z.coerce.boolean().optional(),
  includeTrashed: booleanQueryParam,
});

export type GetPagesAdminDtoType = z.infer<typeof GetPagesAdminDto>;
