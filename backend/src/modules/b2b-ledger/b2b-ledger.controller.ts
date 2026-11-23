import { Request, Response } from 'express';
import { B2BWalletService } from './b2b-wallet.service';
import { B2BLedgerService } from './b2b-ledger.service';
import { TopUpInitiateDto, LedgerQueryDto, LedgerAdjustmentDto, PartnerIdParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BWalletController {
  constructor(private service: B2BWalletService) {}

  summary = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    SuccessResponseDto.send(res, { message: 'Wallet summary retrieved', data: await this.service.summary(partnerId), req });
  };

  ledger = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const pagination = await this.service.listLedger(partnerId, LedgerQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'Ledger retrieved successfully', pagination, req });
  };

  initiateTopUp = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const dto = TopUpInitiateDto.parse(req.body);
    // Trusted, server-computed (same rule as the public PACO checkout) — never client-supplied.
    const base = process.env.PACO_CALLBACK_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const backendUrl = `${base.replace(/\/$/, '')}/api/payments/paco/callback`;
    const data = await this.service.initiateTopUp(partnerId, { userId, email: req.user.email }, dto, backendUrl);
    SuccessResponseDto.created(res, { message: 'Top-up initiated', data, req });
  };
}

export class B2BLedgerAdminController {
  constructor(private ledger: B2BLedgerService) {}

  adjust = async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { id } = PartnerIdParamsDto.parse(req.params);
    const data = await this.ledger.adminAdjust(req.user.userId, id, LedgerAdjustmentDto.parse(req.body));
    SuccessResponseDto.created(res, { message: 'Ledger adjustment posted', data, req });
  };

  summary = async (req: Request, res: Response) => {
    const { id } = PartnerIdParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Wallet summary retrieved', data: await this.ledger.summary(id), req });
  };

  ledger_ = async (req: Request, res: Response) => {
    const { id } = PartnerIdParamsDto.parse(req.params);
    const pagination = await this.ledger.listLedger(id, LedgerQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'Ledger retrieved successfully', pagination, req });
  };
}
