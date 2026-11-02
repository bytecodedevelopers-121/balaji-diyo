import { Request, Response } from 'express';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto, UpdateMenuItemDto, GetMenuItemsDto, ReorderMenuItemsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class MenuItemController {
  constructor(private service: MenuItemService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateMenuItemDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Menu item created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetMenuItemsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Menu items retrieved successfully', data: result, req });
  };

  findTree = async (req: Request, res: Response) => {
    const result = await this.service.findTree(req.params.typeId as string);

    SuccessResponseDto.send(res, { message: 'Menu tree retrieved successfully', data: result, req });
  };

  findTreeByKey = async (req: Request, res: Response) => {
    const result = await this.service.findTreeByKey(req.params.key as string);

    SuccessResponseDto.send(res, { message: 'Menu tree retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Menu item retrieved successfully', data: result, req });
  };

  reorder = async (req: Request, res: Response) => {
    const dto = ReorderMenuItemsDto.parse(req.body);
    await this.service.reorder(dto);

    SuccessResponseDto.send(res, { message: 'Menu item order updated successfully', req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateMenuItemDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Menu item updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Menu item deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Menu item restored successfully', req });
  };
}
