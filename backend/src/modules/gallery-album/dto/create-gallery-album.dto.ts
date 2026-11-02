import { z } from 'zod';

export const CreateGalleryAlbumDto = z.object({
  title: z.string().min(3).max(255),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  destinationId: z.string().min(1, 'Destination is required'),
  displayOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreateGalleryAlbumDtoType = z.infer<typeof CreateGalleryAlbumDto>;
