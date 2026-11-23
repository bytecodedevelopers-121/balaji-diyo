import { Request, Response } from 'express';
import { B2BOnboardingService } from './b2b-onboarding.service';
import { RegisterPartnerDto, UploadKycDocumentDto, KycDocumentParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { partnerScope } from '../../common/guards/b2b.guard';

const uploadedFiles = (req: Request): Express.Multer.File[] => (Array.isArray(req.files) ? req.files : []);

export class B2BOnboardingController {
  constructor(private service: B2BOnboardingService) {}

  register = async (req: Request, res: Response) => {
    const dto = RegisterPartnerDto.parse(req.body);
    const result = await this.service.register(dto, uploadedFiles(req));
    SuccessResponseDto.created(res, {
      message: 'Registration received. Your application is pending KYC review.',
      data: result,
      req,
    });
  };

  me = async (req: Request, res: Response) => {
    const { partnerId, b2bRole } = partnerScope(req.user);
    const data = await this.service.getMyPartner(partnerId, b2bRole);
    SuccessResponseDto.send(res, { message: 'Partner profile retrieved', data, req });
  };

  uploadKycDocuments = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const dto = UploadKycDocumentDto.parse(req.body);
    const data = await this.service.uploadKycDocuments(partnerId, userId, dto, uploadedFiles(req));
    SuccessResponseDto.created(res, { message: 'KYC documents submitted', data, req });
  };

  downloadKycDocument = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const { docId } = KycDocumentParamsDto.parse(req.params);
    const { absolutePath, fileName } = await this.service.getMyKycFile(partnerId, docId);
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(absolutePath, { headers: { 'Content-Disposition': `inline; filename="${fileName}"` } });
  };
}
