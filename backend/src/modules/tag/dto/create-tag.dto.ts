import { z } from 'zod';

export const CreateTagDto = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).optional(),
});

export type CreateTagDtoType = z.infer<typeof CreateTagDto>;
