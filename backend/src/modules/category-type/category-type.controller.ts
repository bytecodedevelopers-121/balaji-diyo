import { Request, Response } from 'express';
import { CategoryTypeService } from './category-type.service';
import { CreateCategoryTypeDto, UpdateCategoryTypeDto, GetCategoryTypesDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class CategoryTypeController {
  constructor(private service: CategoryTypeService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateCategoryTypeDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Category type created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetCategoryTypesDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Category types retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Category type retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateCategoryTypeDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Category type updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Category type deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Category type restored successfully', req });
  };
}
