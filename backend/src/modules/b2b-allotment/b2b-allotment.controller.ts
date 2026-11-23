import { Request, Response } from 'express';
import { B2BAllotmentService } from './b2b-allotment.service';
import { UpsertAllotmentDto, ListAllotmentsQueryDto, SetCapacityDto, DepartureParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';

const adminId = (req: Request): string => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  return req.user.userId;
};

export class B2BAllotmentController {
  constructor(private service: B2BAllotmentService) {}

  list = async (req: Request, res: Response) => {
    const pagination = await this.service.list(ListAllotmentsQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'Allotments retrieved successfully', pagination, req });
  };

  upsert = async (req: Request, res: Response) => {
    const data = await this.service.upsert(adminId(req), UpsertAllotmentDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Allotment saved', data, req });
  };

  setCapacity = async (req: Request, res: Response) => {
    const { id } = DepartureParamsDto.parse(req.params);
    const data = await this.service.setCapacity(id, adminId(req), SetCapacityDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Departure capacity updated', data, req });
  };
}
