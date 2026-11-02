import { z } from 'zod';

export const UpdateMediaDto = z.object({
  altText: z.string().optional(),
});

export type UpdateMediaDtoType = z.infer<typeof UpdateMediaDto>;
