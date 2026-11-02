import { z } from 'zod';

export const CreateGlobalCategoryDto = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'key must be lowercase kebab-case (e.g. "site-info")'),
  name: z.string().min(1).max(255),
});

export type CreateGlobalCategoryDtoType = z.infer<typeof CreateGlobalCategoryDto>;
