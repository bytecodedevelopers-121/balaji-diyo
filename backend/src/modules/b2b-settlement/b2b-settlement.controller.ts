import { Request, Response } from 'express';
import { B2BSettlementService } from './b2b-settlement.service';
import { PeriodDto, AdminSettlementsQueryDto, RecordSettlementDto, PartnerParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BSettlementController {
  constructor(private service: B2BSettlementService) {}

  summary = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const period = PeriodDto.parse({ from: req.query.from, to: req.query.to });
    SuccessResponseDto.send(res, { message: 'Settlement summary retrieved', data: await this.service.summary(partnerId, period), req });
  };

  export = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const period = PeriodDto.parse({ from: req.query.from, to: req.query.to });
    const { csv, truncated } = await this.service.exportCsv(partnerId, period);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="statement-${period.from.toISOString().slice(0, 10)}_${period.to.toISOString().slice(0, 10)}.csv"`);
    res.setHeader('Cache-Control', 'private, no-store');
    if (truncated) res.setHeader('X-Export-Truncated', 'true');
    res.send(csv);
  };
}

export class B2BSettlementAdminController {
  constructor(private service: B2BSettlementService) {}

  list = async (req: Request, res: Response) => {
    const q = AdminSettlementsQueryDto.parse(req.query);
    const period = PeriodDto.parse({ from: q.from, to: q.to });
    if (q.partnerId) {
      SuccessResponseDto.send(res, { message: 'Settlement summary retrieved', data: await this.service.summary(q.partnerId, period), req });
      return;
    }
    const pagination = await this.service.adminOverview(period, q.page, q.perPage);
    SuccessResponseDto.paginated(res, { message: 'Settlement overview retrieved', pagination, req });
  };

  record = async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { id } = PartnerParamsDto.parse(req.params);
    const period = PeriodDto.parse({});
    const data = await this.service.record(req.user.userId, id, RecordSettlementDto.parse(req.body), period);
    if (data.replayed) SuccessResponseDto.send(res, { message: 'Settlement already recorded', data, req });
    else SuccessResponseDto.created(res, { message: 'Settlement recorded', data, req });
  };
}
