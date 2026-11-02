import { Request, Response } from 'express';
import { GlobalCategoryService } from './global-category.service';
import { CreateGlobalCategoryDto, UpdateGlobalCategoryDto, GetGlobalCategoriesDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class GlobalCategoryController {
  constructor(private service: GlobalCategoryService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateGlobalCategoryDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Global category created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetGlobalCategoriesDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Global categories retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Global category retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateGlobalCategoryDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Global category updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Global category deleted successfully', req });
  };
}
