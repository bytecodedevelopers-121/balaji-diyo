import { Request, Response } from 'express';
import { PackageService } from './package.service';
import { CreatePackageDto, UpdatePackageDto, GetPackagesDto, GetPackagesAdminDto, ReorderPackagesDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { toAbsolutePublicFileUrl, withAbsoluteImageField } from '../../lib/media';

export class PackageController {
  constructor(private service: PackageService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreatePackageDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Package created successfully', data: result, req });
  };

  findAllPublic = async (req: Request, res: Response) => {
    const dto = GetPackagesDto.parse(req.query);
    const result = await this.service.findAllPublic(dto);
    const items = result.items.map((item) => withAbsoluteImageField(req, item, 'imageUrl'));

    SuccessResponseDto.send(res, { message: 'Packages retrieved successfully', data: { ...result, items }, req });
  };

  findAllAdmin = async (req: Request, res: Response) => {
    const dto = GetPackagesAdminDto.parse(req.query);
    const result = await this.service.findAllAdmin(dto);
    const items = result.items.map((item) => withAbsoluteImageField(req, item, 'imageUrl'));

    SuccessResponseDto.send(res, { message: 'Packages retrieved successfully', data: { ...result, items }, req });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);
    const withFeaturedImage = withAbsoluteImageField(req, result, 'imageUrl');

    SuccessResponseDto.send(res, {
      message: 'Package retrieved successfully',
      data: {
        ...withFeaturedImage,
        galleryImages: result.galleryImages.map(({ path, ...image }) => ({
          ...image,
          url: toAbsolutePublicFileUrl(req, path),
        })),
        itinerary: result.itinerary
          ? {
              ...result.itinerary,
              details: result.itinerary.details.map((detail) => ({
                ...detail,
                photos: detail.photos.map((photo) => ({ url: toAbsolutePublicFileUrl(req, photo.path), type: photo.type })),
              })),
            }
          : result.itinerary,
      },
      req,
    });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Package retrieved successfully', data: result, req });
  };

  reorder = async (req: Request, res: Response) => {
    const dto = ReorderPackagesDto.parse(req.body);
    await this.service.reorder(dto);

    SuccessResponseDto.send(res, { message: 'Package order updated successfully', req });
  };

  reorderPopular = async (req: Request, res: Response) => {
    const dto = ReorderPackagesDto.parse(req.body);
    await this.service.reorderPopular(dto);

    SuccessResponseDto.send(res, { message: 'Popular package order updated successfully', req });
  };

  reorderInCategory = async (req: Request, res: Response) => {
    const dto = ReorderPackagesDto.parse(req.body);
    await this.service.reorderInCategory(req.params.categoryId as string, dto);

    SuccessResponseDto.send(res, { message: 'Category package order updated successfully', req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdatePackageDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Package updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Package deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Package restored successfully', req });
  };

  hardDelete = async (req: Request, res: Response) => {
    await this.service.hardDelete(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Package permanently deleted', req });
  };
}
