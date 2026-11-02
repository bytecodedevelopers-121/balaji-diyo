import { Request, Response } from 'express';
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto, GetFaqsDto } from './dto';
import { BulkIdsDto } from '../../common/dto/bulk-ids.dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class FaqController {
  constructor(private service: FaqService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateFaqDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'FAQ created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetFaqsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'FAQs retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'FAQ retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateFaqDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'FAQ updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'FAQ deleted successfully', req });
  };

  bulkRemove = async (req: Request, res: Response) => {
    const dto = BulkIdsDto.parse(req.body);
    await this.service.bulkRemove(dto.ids);

    SuccessResponseDto.send(res, { message: 'FAQs deleted successfully', req });
  };
}
