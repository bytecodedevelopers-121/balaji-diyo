import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

export const GetPackagesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  destinationId: z.string().optional(),
  gradeId: z.string().optional(),
  styleId: z.string().optional(),
  categoryId: z.string().optional(),
  placeId: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isPopular: z.coerce.boolean().optional(),
});

export type GetPackagesDtoType = z.infer<typeof GetPackagesDto>;

export const GetPackagesAdminDto = GetPackagesDto.extend({
  isActive: z.coerce.boolean().optional(),
  includeTrashed: booleanQueryParam,
});

export type GetPackagesAdminDtoType = z.infer<typeof GetPackagesAdminDto>;
