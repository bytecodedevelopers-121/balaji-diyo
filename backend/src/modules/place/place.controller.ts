import { Request, Response } from 'express';
import { PlaceService } from './place.service';
import { CreatePlaceDto, UpdatePlaceDto, GetPlacesDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { toAbsolutePublicFileUrl, withAbsoluteImageField } from '../../lib/media';

export class PlaceController {
  constructor(private service: PlaceService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreatePlaceDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Place created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetPlacesDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Places retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Place retrieved successfully', data: result, req });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);
    const withFeaturedImage = withAbsoluteImageField(req, result, 'imageUrl');

    SuccessResponseDto.send(res, {
      message: 'Place retrieved successfully',
      data: {
        ...withFeaturedImage,
        galleryImages: result.galleryImages.map(({ path, ...image }) => ({
          ...image,
          url: toAbsolutePublicFileUrl(req, path),
        })),
      },
      req,
    });
  };

  findAttractions = async (req: Request, res: Response) => {
    const result = await this.service.findAttractions();
    const withImage = <T extends { imageUrl: string | null }>(item: T) =>
      withAbsoluteImageField(req, item, 'imageUrl');

    SuccessResponseDto.send(res, {
      message: 'Attractions retrieved successfully',
      data: {
        featuredPlaces: result.featuredPlaces.map(withImage),
        regions: result.regions.map((region) => ({ ...region, places: region.places.map(withImage) })),
      },
      req,
    });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdatePlaceDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Place updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Place deleted successfully', req });
  };
}
