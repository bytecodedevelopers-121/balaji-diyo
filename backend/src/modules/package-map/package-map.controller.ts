import { Request, Response } from 'express';
import { PackageMapService } from './package-map.service';
import { CreatePackageMapDto, UpdatePackageMapDto, GetPackageMapsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { withAbsoluteImageField } from '../../lib/media';

export class PackageMapController {
  constructor(private service: PackageMapService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreatePackageMapDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Trip map created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetPackageMapsDto.parse(req.query);
    const result = await this.service.findAll(dto);
    const items = result.items.map((item) => withAbsoluteImageField(req, item, 'mapImageUrl'));

    SuccessResponseDto.send(res, { message: 'Trip maps retrieved successfully', data: { ...result, items }, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, {
      message: 'Trip map retrieved successfully',
      data: withAbsoluteImageField(req, result, 'mapImageUrl'),
      req,
    });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);

    SuccessResponseDto.send(res, {
      message: 'Trip map retrieved successfully',
      data: withAbsoluteImageField(req, result, 'mapImageUrl'),
      req,
    });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdatePackageMapDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Trip map updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Trip map deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Trip map restored successfully', req });
  };

  hardDelete = async (req: Request, res: Response) => {
    await this.service.hardDelete(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Trip map permanently deleted', req });
  };
}
