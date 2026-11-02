import { z } from 'zod';

export const CreateMenuTypeDto = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'key must be lowercase kebab-case (e.g. "header-nav")'),
  name: z.string().min(1).max(255),
});

export type CreateMenuTypeDtoType = z.infer<typeof CreateMenuTypeDto>;
