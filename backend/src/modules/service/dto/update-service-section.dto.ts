import { z } from 'zod';

export const UpdateServiceSectionDto = z
  .object({
    eyebrow: z.string().trim().min(1).max(100).optional(),
    heading: z.string().trim().min(1).max(255).optional(),
    introduction: z.string().trim().min(1).max(2000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

export type UpdateServiceSectionDtoType = z.infer<typeof UpdateServiceSectionDto>;
