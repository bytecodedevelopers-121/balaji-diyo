import { Request, Response } from 'express';
import { ContactMessageService } from './contact-message.service';
import { CreateContactMessageDto, GetContactMessagesDto } from './dto';
import { BulkIdsDto } from '../../common/dto/bulk-ids.dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class ContactMessageController {
  constructor(private service: ContactMessageService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateContactMessageDto.parse(req.body);
    const result = await this.service.create(dto, req.ip);

    SuccessResponseDto.created(res, { message: 'Message sent successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetContactMessagesDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Contact messages retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Contact message retrieved successfully', data: result, req });
  };

  markRead = async (req: Request, res: Response) => {
    const result = await this.service.setRead(req.params.id as string, true);

    SuccessResponseDto.send(res, { message: 'Marked as read', data: result, req });
  };

  markUnread = async (req: Request, res: Response) => {
    const result = await this.service.setRead(req.params.id as string, false);

    SuccessResponseDto.send(res, { message: 'Marked as unread', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Contact message deleted successfully', req });
  };

  bulkRemove = async (req: Request, res: Response) => {
    const dto = BulkIdsDto.parse(req.body);
    await this.service.bulkRemove(dto.ids);

    SuccessResponseDto.send(res, { message: 'Contact messages deleted successfully', req });
  };
}
