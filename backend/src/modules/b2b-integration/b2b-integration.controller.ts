import { Request, Response } from 'express';
import { B2BIntegrationService } from './b2b-integration.service';
import { CreateApiKeyDto, CreateWebhookDto, UpdateWebhookDto, IdParamsDto, DeliveriesQueryDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BDeveloperController {
  constructor(private service: B2BIntegrationService) {}

  listKeys = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    SuccessResponseDto.send(res, { message: 'API keys retrieved', data: await this.service.listKeys(partnerId), req });
  };

  createKey = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const data = await this.service.createKey(partnerId, userId, CreateApiKeyDto.parse(req.body));
    res.setHeader('Cache-Control', 'no-store'); // the response carries a one-time secret
    SuccessResponseDto.created(res, { message: 'API key created', data, req });
  };

  revokeKey = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const { id } = IdParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'API key revoked', data: await this.service.revokeKey(partnerId, userId, id), req });
  };

  rotateKey = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const { id } = IdParamsDto.parse(req.params);
    res.setHeader('Cache-Control', 'no-store');
    SuccessResponseDto.created(res, { message: 'API key rotated', data: await this.service.rotateKey(partnerId, userId, id), req });
  };

  listWebhooks = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    SuccessResponseDto.send(res, { message: 'Webhook endpoints retrieved', data: await this.service.listWebhooks(partnerId), req });
  };

  createWebhook = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const data = await this.service.createWebhook(partnerId, userId, CreateWebhookDto.parse(req.body));
    res.setHeader('Cache-Control', 'no-store');
    SuccessResponseDto.created(res, { message: 'Webhook endpoint created', data, req });
  };

  updateWebhook = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const { id } = IdParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Webhook endpoint updated', data: await this.service.updateWebhook(partnerId, userId, id, UpdateWebhookDto.parse(req.body)), req });
  };

  deleteWebhook = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const { id } = IdParamsDto.parse(req.params);
    await this.service.deleteWebhook(partnerId, userId, id);
    SuccessResponseDto.send(res, { message: 'Webhook endpoint deleted', req });
  };

  rotateSecret = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const { id } = IdParamsDto.parse(req.params);
    res.setHeader('Cache-Control', 'no-store');
    SuccessResponseDto.send(res, { message: 'Signing secret rotated', data: await this.service.rotateWebhookSecret(partnerId, userId, id), req });
  };

  sendTest = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const { id } = IdParamsDto.parse(req.params);
    SuccessResponseDto.created(res, { message: 'Test event queued', data: await this.service.sendTest(partnerId, id), req });
  };

  deliveries = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const { id } = IdParamsDto.parse(req.params);
    const pagination = await this.service.listDeliveries(partnerId, id, DeliveriesQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'Deliveries retrieved', pagination, req });
  };
}
