import { Request, Response } from 'express';
import { GroupFaqService } from './group-faq.service';
import { CreateGroupFaqDto, UpdateGroupFaqDto, GetGroupFaqsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class GroupFaqController {
  constructor(private service: GroupFaqService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateGroupFaqDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Group FAQ created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetGroupFaqsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Group FAQs retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Group FAQ retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateGroupFaqDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Group FAQ updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Group FAQ deleted successfully', req });
  };
}
