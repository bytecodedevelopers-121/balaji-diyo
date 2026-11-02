import { Request, Response } from 'express';
import { TagService } from './tag.service';
import { CreateTagDto, UpdateTagDto, GetTagsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class TagController {
  constructor(private service: TagService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateTagDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Tag created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetTagsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Tags retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Tag retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateTagDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Tag updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Tag deleted successfully', req });
  };
}
