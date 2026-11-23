import { Request, Response } from 'express';
import { B2BInventoryService } from './b2b-inventory.service';
import { CreateHoldDto, ListHoldsQueryDto, HoldParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BInventoryController {
  constructor(private service: B2BInventoryService) {}

  createHold = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const data = await this.service.createHold(partnerId, userId, CreateHoldDto.parse(req.body));
    SuccessResponseDto.created(res, { message: 'Seats held', data, req });
  };

  listHolds = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const pagination = await this.service.listHolds(partnerId, ListHoldsQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'Holds retrieved successfully', pagination, req });
  };

  getHold = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const { id } = HoldParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Hold retrieved successfully', data: await this.service.getHold(partnerId, id), req });
  };

  releaseHold = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const { id } = HoldParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Hold released', data: await this.service.releaseHold(partnerId, userId, id), req });
  };
}
