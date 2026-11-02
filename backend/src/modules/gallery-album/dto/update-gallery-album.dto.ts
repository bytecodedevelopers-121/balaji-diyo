import { z } from 'zod';
import { CreateGalleryAlbumDto } from './create-gallery-album.dto';

export const UpdateGalleryAlbumDto = CreateGalleryAlbumDto.partial();

export type UpdateGalleryAlbumDtoType = z.infer<typeof UpdateGalleryAlbumDto>;
