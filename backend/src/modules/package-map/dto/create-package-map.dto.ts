import { z } from 'zod';

export const CreatePackageMapDto = z.object({
  packageId: z.string().min(1),
  mapTitle: z.string().min(1).max(255),
  slug: z.string().min(1).optional(),
  mapAbstract: z.string().optional(),
  mapDetails: z.string().optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreatePackageMapDtoType = z.infer<typeof CreatePackageMapDto>;
