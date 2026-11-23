import { Prisma } from '@prisma/client';
import { PaymentRepository } from './payment.repository';
import {
  CreatePaymentDtoType,
  UpdatePaymentStatusDtoType,
  GetPaymentsDtoType,
  InitiatePacoPaymentDtoType,
  PacoCallbackDtoType,
} from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { assertInTrash, runHardDelete } from '../../lib/hard-delete';
import { BookingService } from '../booking/booking.service';
import { getUsdToNprRate } from '../../lib/exchange-rate';
import { PacoClient, PacoRejectedError } from './paco/paco.client';
import { isPacoConfiguredFor, pacoConfig, pacoConfigFor } from '../../config/paco';
import { decryptAndVerify } from './paco/paco.crypto';
import { sendMail } from '../../lib/mail';
import { mailConfig } from '../../config/mail';
import { paymentRequestCustomerEmail, paymentSuccessAdminEmail, paymentSuccessCustomerEmail } from './payment.mail';

// Admin CRUD below is record-keeping only, as before. PACO is the one gateway
// with a real integration (see initiatePacoPayment/handlePacoCallback) —
// NABIL/HBL/NICA still have none; that still needs real credentials + each
// gateway's API contract, same as PACO did until this was built.
interface PacoNotification {
  response?: {
    Data?: { paymentResult?: { orderNo?: string; paymentStatusInfo?: { PaymentStatus?: string } } };
    ApiResponse?: { ResponseCode?: string };
  };
}

type PaymentRow = Awaited<ReturnType<PaymentRepository['update']>>;
type PaymentSuccessListener = (payment: PaymentRow) => Promise<void>;

export class PaymentService {
  // Called whenever a payment is confirmed SUCCESS through a trusted path (see registerSuccessListener).
  private successListeners: PaymentSuccessListener[] = [];

  constructor(
    private repository: PaymentRepository,
    private pacoClient: PacoClient,
    private bookingService: BookingService,
  ) {}

  /**
   * Lets other modules react to a confirmed payment (the B2B wallet top-up credit) without this
   * service importing them. Listeners MUST be idempotent: they can run for the same payment more
   * than once (webhook retries, manual status changes). Only trusted paths notify — the signed
   * JOSE notification and an authenticated admin status change — never the unsigned callback.
   */
  registerSuccessListener(listener: PaymentSuccessListener): void {
    this.successListeners.push(listener);
  }

  private async notifySuccessListeners(payment: PaymentRow): Promise<void> {
    for (const listener of this.successListeners) await listener(payment);
  }

  async create(dto: CreatePaymentDtoType) {
    try {
      return await this.repository.create(dto);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ApiError(400, 'Invalid packageId');
      }
      throw err;
    }
  }

  async findAll(dto: GetPaymentsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.PaymentWhereInput = {
      ...(dto.packageId ? { packageId: dto.packageId } : {}),
      ...(dto.gateway ? { gateway: dto.gateway } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      deletedAt: dto.includeTrashed ? { not: null } : null,
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const payment = await this.repository.findById(id);
    if (!payment) throw new ApiError(404, 'Payment not found');
    return payment;
  }

  async remove(id: string) {
    const payment = await this.findById(id);
    if (payment.deletedAt) throw new ApiError(409, 'Payment is already in Trash');
    await this.repository.softDelete(id);
  }

  async restore(id: string) {
    await this.findById(id);
    await this.repository.restore(id);
  }

  async hardDelete(id: string) {
    assertInTrash(await this.repository.findById(id), 'Payment');
    await runHardDelete(() => this.repository.hardDelete(id));
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDtoType) {
    await this.findById(id);
    const updated = await this.repository.updateStatus(id, dto);
    if (updated.status === 'SUCCESS') await this.notifySuccessListeners(updated);
    return updated;
  }

  // `backendUrl` is computed by the controller from the trusted request host
  // (never client-supplied) — see payment.controller.ts#initiatePaco.
  // `options` is server-side only (never part of the request DTO): the B2B wallet top-up passes the
  // authenticated partner here so the payment can be matched back to it on success.
  async initiatePacoPayment(dto: InitiatePacoPaymentDtoType, backendUrl: string, options?: { b2bPartnerId?: string }) {
    const currency = dto.currency ?? pacoConfig.chargeCurrency;
    if (!isPacoConfiguredFor(currency)) {
      throw new ApiError(503, `PACO payment gateway is not configured for ${currency}`);
    }

    // Prices are USD site-wide; PACO charges NPR at the live NRB rate,
    // whole rupees. Fetched before any row is written so a rate outage
    // fails cleanly instead of leaving a stray PENDING payment.
    const exchangeRate = currency === 'NPR' ? await getUsdToNprRate() : null;
    const chargedAmount = exchangeRate ? Math.round(dto.amount * exchangeRate) : dto.amount;

    const orderNo = Date.now().toString();
    const description = dto.description || 'Package booking';

    const payment = await this.repository.create({
      gateway: 'PACO',
      packageId: dto.packageId,
      bookingId: dto.bookingId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      description,
      ...(options?.b2bPartnerId ? { b2bPartnerId: options.b2bPartnerId } : {}),
      percentage: dto.percentage,
      totalAmount: dto.amount,
      currency,
      ...(exchangeRate ? { exchangeRate, chargedAmount } : {}),
      status: 'PENDING',
      gatewayReference: orderNo,
      requestPayload: { orderNo, ...dto, currency, exchangeRate, chargedAmount } as Prisma.InputJsonValue,
    });

    try {
      const result = await this.pacoClient.initiateCheckout({
        orderNo,
        amount: chargedAmount,
        currency,
        description,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        percentage: dto.percentage,
        successUrl: `${pacoConfig.publicSiteUrl}/payment-success`,
        failedUrl: `${pacoConfig.publicSiteUrl}/payment-failed`,
        cancelUrl: `${pacoConfig.publicSiteUrl}/payment-cancel`,
        backendUrl,
      });

      const updated = await this.repository.update(payment.id, {
        gatewayReference: result.orderNo,
        gatewayTransactionId: result.controllerInternalId,
        responsePayload: result.rawResponse as Prisma.InputJsonValue,
      });

      // Only once PACO has actually issued a checkout page (a failed
      // initiation above never emails) — and fire-and-forget, so a slow or
      // failing send can't hold up the redirect.
      if (dto.standalone) {
        void sendMail({ to: dto.customerEmail, ...paymentRequestCustomerEmail(updated) });
      }

      return { paymentUrl: result.paymentPageUrl, payment: updated };
    } catch (err) {
      const responsePayload =
        err instanceof PacoRejectedError
          ? ({ httpStatus: err.httpStatus, detail: err.detail } as Prisma.InputJsonValue)
          : undefined;
      await this.repository.update(payment.id, { status: 'FAILED', ...(responsePayload ? { responsePayload } : {}) });
      throw err instanceof ApiError ? err : new ApiError(502, 'PACO checkout initiation failed');
    }
  }

  // PACO's real backend notification: a JOSE token (JWE-wrapped, signed — the
  // signature is verified against PACO's public key, unlike the plain-field
  // callback flamingo-base assumed). paymentStatusInfo.PaymentStatus 'A' with
  // ResponseCode PC-B050000 is an approved payment (confirmed from a live
  // NPR callback). Any other outcome is only stored, not guessed at.
  async handlePacoNotification(token: string) {
    let decoded: PacoNotification | undefined;
    for (const currency of ['USD', 'NPR'] as const) {
      try {
        decoded = (await decryptAndVerify(token.trim(), pacoConfigFor(currency))) as PacoNotification;
        break;
      } catch {
        // try the other currency's key set
      }
    }
    if (!decoded) throw new ApiError(400, 'Unrecognised PACO notification');

    const result = decoded.response?.Data?.paymentResult;
    const orderNo = result?.orderNo;
    const payment = orderNo ? await this.repository.findByGatewayReference(orderNo) : null;
    if (!payment) throw new ApiError(404, 'Payment not found for this order');

    const approved =
      result?.paymentStatusInfo?.PaymentStatus === 'A' && decoded.response?.ApiResponse?.ResponseCode === 'PC-B050000';
    const existing =
      payment.responsePayload && typeof payment.responsePayload === 'object'
        ? (payment.responsePayload as Record<string, unknown>)
        : {};
    const updated = await this.repository.update(payment.id, {
      ...(approved ? { status: 'SUCCESS' as const } : {}),
      responsePayload: { ...existing, pacoNotification: decoded } as unknown as Prisma.InputJsonValue,
    });

    // A repeated notification for an already-approved payment must not resend.
    if (approved && payment.status !== 'SUCCESS') await this.sendPaymentSuccess(updated);
    // Listeners run on every approved (signature-verified) notification, not just the first: they are
    // idempotent, and if a previous attempt crashed after the status flip, a PACO retry still completes it.
    if (approved) await this.notifySuccessListeners(updated);
    return { received: true };
  }

  private async sendPaymentSuccess(payment: Awaited<ReturnType<PaymentRepository['update']>>) {
    // Fire-and-forget: a slow or failing send must never break the webhook
    // response PACO is waiting on.
    if (payment.customerEmail) {
      void sendMail({ to: payment.customerEmail, ...paymentSuccessCustomerEmail(payment) });
    }
    if (mailConfig.adminEmail) {
      void sendMail({ to: mailConfig.adminEmail, ...paymentSuccessAdminEmail(payment) });
    }
    if (payment.bookingId) await this.bookingService.notifyPaid(payment.bookingId);
  }

  // SECURITY TODO: PACO's callback carries no signature — this trusts
  // whatever order_id/payment_status a POST claims, matching flamingo-base's
  // checkHblPayment() behavior exactly (no official 2c2p webhook-signing docs
  // were available to build real verification against — see memory). Harden
  // this once those docs exist, e.g. verify a JOSE-signed body instead of
  // trusting plain fields.
  async handlePacoCallback(dto: PacoCallbackDtoType, rawBody: Record<string, unknown>) {
    const payment = await this.repository.findByGatewayReference(dto.order_id);
    if (!payment) throw new ApiError(404, 'Payment not found for this order');

    // This callback is unsigned (see the SECURITY TODO above) and order numbers are timestamps, so it
    // must never be able to move money: B2B wallet top-ups only settle via the verified JOSE
    // notification (or an admin status change). The payload is kept for diagnostics, status untouched.
    if (payment.b2bPartnerId) {
      const prior = payment.responsePayload && typeof payment.responsePayload === 'object' ? (payment.responsePayload as Record<string, unknown>) : {};
      return this.repository.update(payment.id, { responsePayload: { ...prior, unsignedCallbackIgnored: rawBody } as Prisma.InputJsonValue });
    }

    const status = dto.payment_status.toUpperCase() === 'APPROVED' ? 'SUCCESS' : 'FAILED';
    // Kept alongside the initiate-time payload (not overwritten) so a real
    // decline/reason code PACO sends beyond order_id/payment_status — which
    // PacoCallbackDto otherwise strips silently — is still visible in the
    // admin Payments view for diagnosing a failure after the fact.
    const existingPayload =
      payment.responsePayload && typeof payment.responsePayload === 'object'
        ? (payment.responsePayload as Record<string, unknown>)
        : {};
    const responsePayload = { ...existingPayload, pacoCallback: rawBody } as Prisma.InputJsonValue;
    const updated = await this.repository.update(payment.id, { status, responsePayload });

    // A repeated webhook for an already-approved payment must not resend.
    if (status !== 'SUCCESS' || payment.status === 'SUCCESS') return updated;

    await this.sendPaymentSuccess(updated);

    return updated;
  }
}
