import { ApiError } from '../../common/exceptions/api-error';
import { PaymentService } from '../payment/payment.service';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { B2BFinanceRepository } from '../b2b-finance/b2b-finance.repository';
import { B2BLedgerService, assertUsdSettlement } from './b2b-ledger.service';
import type { LedgerQueryDtoType, TopUpInitiateDtoType } from './dto';

export class B2BWalletService {
  constructor(
    private ledger: B2BLedgerService,
    private repository: B2BFinanceRepository,
    private payments: PaymentService,
  ) {
    // A top-up Payment confirmed through a trusted path credits the wallet (idempotent; see creditWalletForPayment).
    this.payments.registerSuccessListener(async (payment) => {
      if (payment.b2bPartnerId && !payment.bookingId) await this.ledger.creditWalletForPayment(payment.id);
    });
  }

  summary(partnerId: string) {
    return this.ledger.summary(partnerId);
  }

  listLedger(partnerId: string, dto: LedgerQueryDtoType) {
    return this.ledger.listLedger(partnerId, dto);
  }

  /**
   * Starts a gateway checkout for a wallet top-up. Nothing is credited here — only when the gateway
   * later confirms the payment. `amount` is USD (the wallet currency); PACO may charge it in NPR.
   */
  async initiateTopUp(partnerId: string, actor: { userId: string; email: string }, dto: TopUpInitiateDtoType, backendUrl: string) {
    const partner = await this.repository.findPartnerContact(partnerId);
    if (!partner) throw new ApiError(404, 'Partner not found');
    if (partner.status !== 'ACTIVE') throw new ApiError(403, 'Partner account is not active');
    assertUsdSettlement({ currency: partner.currency } as Parameters<typeof assertUsdSettlement>[0]);

    const result = await this.payments.initiatePacoPayment(
      {
        customerName: partner.legalName,
        customerEmail: actor.email,
        amount: dto.amount.toNumber(),
        description: 'B2B wallet top-up',
        ...(dto.currency ? { currency: dto.currency } : {}),
      },
      backendUrl,
      { b2bPartnerId: partnerId },
    );
    await this.repository.writeAudit(buildAuditEntry({
      actorType: 'user', actorId: actor.userId, action: 'wallet.topup_initiated', title: 'Wallet top-up initiated',
      category: 'b2b_partner', categoryId: partnerId, data: { paymentId: result.payment.id, amount: dto.amount.toString() },
    }));
    return { paymentUrl: result.paymentUrl, paymentId: result.payment.id };
  }
}
