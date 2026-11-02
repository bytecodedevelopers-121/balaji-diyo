import { z } from 'zod';

export const GetGalleryAlbumsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  destinationId: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetGalleryAlbumsDtoType = z.infer<typeof GetGalleryAlbumsDto>;
