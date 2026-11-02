import { z } from 'zod';

export const CreateTripInfoDto = z.object({
  title: z.string().min(5).max(255),
  slug: z.string().min(1).optional(),
  description: z.string().min(5),
  isActive: z.boolean().optional(),
  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreateTripInfoDtoType = z.infer<typeof CreateTripInfoDto>;
