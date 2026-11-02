import { z } from 'zod';

export const GetMediaDto = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
  perPage: z.string().optional(),
  // Restricts the media library browse list by type. Without this, a video
  // uploaded from the itinerary day gallery (the only picker that allows
  // video) would also show up — unselectable-but-confusing — in every
  // other, image-only picker (team photos, page banners, ...).
  type: z.enum(['image', 'video']).optional(),
});

export type GetMediaDtoType = z.infer<typeof GetMediaDto>;
