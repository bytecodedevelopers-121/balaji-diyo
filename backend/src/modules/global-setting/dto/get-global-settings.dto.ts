import { z } from 'zod';

export const GetGlobalSettingsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  keyGroup: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetGlobalSettingsDtoType = z.infer<typeof GetGlobalSettingsDto>;
