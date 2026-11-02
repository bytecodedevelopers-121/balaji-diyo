import { Request, Response } from 'express';
import { CostCategoryService } from './cost-category.service';
import { CreateCostCategoryDto, UpdateCostCategoryDto, GetCostCategoriesDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class CostCategoryController {
  constructor(private service: CostCategoryService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateCostCategoryDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Cost category created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetCostCategoriesDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Cost categories retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Cost category retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateCostCategoryDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Cost category updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Cost category deleted successfully', req });
  };
}
