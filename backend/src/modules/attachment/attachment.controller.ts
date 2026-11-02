import { Request, Response } from 'express';
import { AttachmentService } from './attachment.service';
import { CreateAttachmentDto, GetAttachmentsDto, ReorderAttachmentsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class AttachmentController {
  constructor(private service: AttachmentService) {}

  attach = async (req: Request, res: Response) => {
    const dto = CreateAttachmentDto.parse(req.body);
    const result = await this.service.attach(dto);

    SuccessResponseDto.created(res, { message: 'Attachment created successfully', data: result, req });
  };

  findByOwner = async (req: Request, res: Response) => {
    const dto = GetAttachmentsDto.parse(req.query);
    const result = await this.service.findByOwner(dto);

    SuccessResponseDto.send(res, { message: 'Attachments retrieved successfully', data: result, req });
  };

  reorder = async (req: Request, res: Response) => {
    const dto = ReorderAttachmentsDto.parse(req.body);
    await this.service.reorder(dto);

    SuccessResponseDto.send(res, { message: 'Attachments reordered successfully', req });
  };

  detach = async (req: Request, res: Response) => {
    await this.service.detach(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Attachment deleted successfully', req });
  };
}
