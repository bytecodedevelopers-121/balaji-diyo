import { Request, Response } from 'express';
import { B2BSlaService } from './b2b-sla.service';
import { ListSlaQueryDto, UpdateSlaDto, SlaParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BSlaController {
  constructor(private service: B2BSlaService) {}

  listMine = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const pagination = await this.service.listForPartner(partnerId, ListSlaQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'SLA tickets retrieved', pagination, req });
  };

  listAdmin = async (req: Request, res: Response) => {
    const pagination = await this.service.listForAdmin(ListSlaQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'SLA tickets retrieved', pagination, req });
  };

  update = async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { id } = SlaParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'SLA ticket updated', data: await this.service.adminUpdate(req.user.userId, id, UpdateSlaDto.parse(req.body)), req });
  };
}
