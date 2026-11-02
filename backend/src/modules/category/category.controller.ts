import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, GetCategoriesDto } from './dto';
import { BulkIdsDto } from '../../common/dto/bulk-ids.dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { withAbsoluteImageField } from '../../lib/media';

export class CategoryController {
  constructor(private service: CategoryService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateCategoryDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Category created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetCategoriesDto.parse(req.query);
    const result = await this.service.findAll(dto);

    const items = result.items.map((item) => withAbsoluteImageField(req, item, 'imageUrl'));
    SuccessResponseDto.send(res, { message: 'Categories retrieved successfully', data: { ...result, items }, req });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);
    SuccessResponseDto.send(res, {
      message: 'Category retrieved successfully',
      data: withAbsoluteImageField(req, result, 'imageUrl'),
      req,
    });
  };

  findTree = async (req: Request, res: Response) => {
    const result = await this.service.findTree(req.params.typeId as string);

    SuccessResponseDto.send(res, { message: 'Category tree retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Category retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateCategoryDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Category updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Category deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Category restored successfully', req });
  };

  bulkRemove = async (req: Request, res: Response) => {
    const dto = BulkIdsDto.parse(req.body);
    await this.service.bulkRemove(dto.ids);

    SuccessResponseDto.send(res, { message: 'Categories deleted successfully', req });
  };

  hardDelete = async (req: Request, res: Response) => {
    await this.service.hardDelete(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Category permanently deleted', req });
  };
}
