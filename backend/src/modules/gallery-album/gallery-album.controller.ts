import { Request, Response } from 'express';
import { GalleryAlbumService } from './gallery-album.service';
import { CreateGalleryAlbumDto, UpdateGalleryAlbumDto, GetGalleryAlbumsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { toAbsolutePublicFileUrl, withAbsoluteImageField } from '../../lib/media';

export class GalleryAlbumController {
  constructor(private service: GalleryAlbumService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateGalleryAlbumDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Gallery album created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetGalleryAlbumsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Gallery albums retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Gallery album retrieved successfully', data: result, req });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);
    const withCoverImage = withAbsoluteImageField(req, result, 'imageUrl');

    SuccessResponseDto.send(res, {
      message: 'Gallery album retrieved successfully',
      data: {
        ...withCoverImage,
        galleryImages: result.galleryImages.map(({ path, ...image }) => ({
          ...image,
          url: toAbsolutePublicFileUrl(req, path),
        })),
      },
      req,
    });
  };

  findShowcase = async (req: Request, res: Response) => {
    const result = await this.service.findShowcase();
    const withImage = <T extends { imageUrl: string | null }>(item: T) =>
      withAbsoluteImageField(req, item, 'imageUrl');

    SuccessResponseDto.send(res, {
      message: 'Gallery showcase retrieved successfully',
      data: {
        featuredAlbums: result.featuredAlbums.map(withImage),
        destinations: result.destinations.map((destination) => ({
          ...destination,
          albums: destination.albums.map(withImage),
          images: destination.images.map((image) => ({
            url: toAbsolutePublicFileUrl(req, image.url),
            albumSlug: image.albumSlug,
          })),
        })),
      },
      req,
    });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateGalleryAlbumDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Gallery album updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Gallery album deleted successfully', req });
  };
}
