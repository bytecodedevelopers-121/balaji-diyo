import { Request, Response } from 'express';
import { B2BAdminService } from './b2b-admin.service';
import {
  ListPartnersQueryDto, PartnerParamsDto, PartnerDocParamsDto, TierParamsDto, ReviewKycDto, PartnerDecisionDto,
  CreateTierDto, UpdateTierDto, ListTiersQueryDto,
} from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';

const adminId = (req: Request): string => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  return req.user.userId;
};

export class B2BAdminController {
  constructor(private service: B2BAdminService) {}

  listPartners = async (req: Request, res: Response) => {
    const pagination = await this.service.listPartners(ListPartnersQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'Partners retrieved successfully', pagination, req });
  };

  getPartner = async (req: Request, res: Response) => {
    const { id } = PartnerParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Partner retrieved successfully', data: await this.service.getPartner(id), req });
  };

  reviewKyc = async (req: Request, res: Response) => {
    const { id } = PartnerParamsDto.parse(req.params);
    const data = await this.service.reviewDocument(id, adminId(req), ReviewKycDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'KYC document reviewed', data, req });
  };

  decide = async (req: Request, res: Response) => {
    const { id } = PartnerParamsDto.parse(req.params);
    const data = await this.service.decide(id, adminId(req), PartnerDecisionDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Partner updated', data, req });
  };

  downloadKycDocument = async (req: Request, res: Response) => {
    const { id, docId } = PartnerDocParamsDto.parse(req.params);
    const { absolutePath, fileName } = await this.service.getKycFile(id, docId);
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(absolutePath, { headers: { 'Content-Disposition': `inline; filename="${fileName}"` } });
  };

  listTiers = async (req: Request, res: Response) => {
    const { activeOnly } = ListTiersQueryDto.parse(req.query);
    SuccessResponseDto.send(res, { message: 'Tiers retrieved successfully', data: await this.service.listTiers(activeOnly ?? false), req });
  };

  createTier = async (req: Request, res: Response) => {
    const data = await this.service.createTier(adminId(req), CreateTierDto.parse(req.body));
    SuccessResponseDto.created(res, { message: 'Tier created', data, req });
  };

  updateTier = async (req: Request, res: Response) => {
    const { id } = TierParamsDto.parse(req.params);
    const data = await this.service.updateTier(id, adminId(req), UpdateTierDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Tier updated', data, req });
  };
}
