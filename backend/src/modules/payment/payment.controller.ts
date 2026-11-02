import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, UpdatePaymentStatusDto, GetPaymentsDto, InitiatePacoPaymentDto, PacoCallbackDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class PaymentController {
  constructor(private service: PaymentService) {}

  initiatePaco = async (req: Request, res: Response) => {
    const dto = InitiatePacoPaymentDto.parse(req.body);
    // Trusted, server-computed — never client-supplied — so PACO's webhook
    // can't be pointed anywhere but this API.
    // PACO_CALLBACK_BASE_URL overrides the request host (e.g. a dev tunnel,
    // since PACO's servers can't reach localhost).
    const base = process.env.PACO_CALLBACK_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const backendUrl = `${base.replace(/\/$/, '')}/api/payments/paco/callback`;
    const result = await this.service.initiatePacoPayment(dto, backendUrl);

    SuccessResponseDto.created(res, { message: 'PACO checkout initiated', data: result, req });
  };

  pacoCallback = async (req: Request, res: Response) => {
    if (typeof req.body === 'string') {
      const received = await this.service.handlePacoNotification(req.body);
      SuccessResponseDto.send(res, { message: 'PACO notification received', data: received, req });
      return;
    }
    const dto = PacoCallbackDto.parse(req.body);
    // req.body passed alongside the parsed dto so any fields 2C2P sends beyond
    // order_id/payment_status (e.g. a decline reason code) aren't silently
    // dropped — see handlePacoCallback.
    const result = await this.service.handlePacoCallback(dto, req.body as Record<string, unknown>);

    SuccessResponseDto.send(res, { message: 'PACO callback processed', data: result, req });
  };

  create = async (req: Request, res: Response) => {
    const dto = CreatePaymentDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Payment recorded successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetPaymentsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Payments retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Payment retrieved successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Payment moved to Trash', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Payment restored successfully', req });
  };

  hardDelete = async (req: Request, res: Response) => {
    await this.service.hardDelete(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Payment permanently deleted', req });
  };

  updateStatus = async (req: Request, res: Response) => {
    const dto = UpdatePaymentStatusDto.parse(req.body);
    const result = await this.service.updateStatus(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Payment status updated successfully', data: result, req });
  };
}
