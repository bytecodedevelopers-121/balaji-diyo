import { Request, Response } from 'express';
import { ActivityLogService } from './activity-log.service';
import { GetActivityLogsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class ActivityLogController {
  constructor(private service: ActivityLogService) {}

  findAll = async (req: Request, res: Response) => {
    const dto = GetActivityLogsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Activity logs retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Activity log retrieved successfully', data: result, req });
  };
}
