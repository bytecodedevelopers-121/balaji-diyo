import { z } from 'zod';

export const CreateCategoryTypeDto = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'key must be lowercase kebab-case (e.g. "destination")'),
  name: z.string().min(1).max(255),
});

export type CreateCategoryTypeDtoType = z.infer<typeof CreateCategoryTypeDto>;
