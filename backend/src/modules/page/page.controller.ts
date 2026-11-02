import { Request, Response } from 'express';
import { PageService } from './page.service';
import { CreatePageDto, UpdatePageDto, GetPagesDto, GetPagesAdminDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class PageController {
  constructor(private service: PageService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreatePageDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Page created successfully', data: result, req });
  };

  findAllPublic = async (req: Request, res: Response) => {
    const dto = GetPagesDto.parse(req.query);
    const result = await this.service.findAllPublic(dto);

    SuccessResponseDto.send(res, { message: 'Pages retrieved successfully', data: result, req });
  };

  findAllAdmin = async (req: Request, res: Response) => {
    const dto = GetPagesAdminDto.parse(req.query);
    const result = await this.service.findAllAdmin(dto);

    SuccessResponseDto.send(res, { message: 'Pages retrieved successfully', data: result, req });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);

    SuccessResponseDto.send(res, { message: 'Page retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Page retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdatePageDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Page updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Page deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Page restored successfully', req });
  };

  hardDelete = async (req: Request, res: Response) => {
    await this.service.hardDelete(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Page permanently deleted', req });
  };
}
