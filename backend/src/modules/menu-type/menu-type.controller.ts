import { Request, Response } from 'express';
import { MenuTypeService } from './menu-type.service';
import { CreateMenuTypeDto, UpdateMenuTypeDto, GetMenuTypesDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class MenuTypeController {
  constructor(private service: MenuTypeService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateMenuTypeDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Menu type created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetMenuTypesDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Menu types retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Menu type retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateMenuTypeDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Menu type updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Menu type deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Menu type restored successfully', req });
  };
}
