import { z } from 'zod';

export const SaveSectionDto = z.object({
  content: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional(),
});
export type SaveSectionDtoType = z.infer<typeof SaveSectionDto>;
