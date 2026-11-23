import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { sendMail } from '../../lib/mail';
import { mailConfig } from '../../config/mail';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { BASE_CATALOG_CURRENCY, Dec, round2 } from '../b2b-common/b2b-money';
import { B2BFinanceRepository, FinanceTx } from '../b2b-finance/b2b-finance.repository';
import { availableCredit, evaluateCreditAlert, utilizationPct, CREDIT_ALERT_THRESHOLD } from './credit.policy';
import type { CreditAlertEvent, LockedPartner, PostEntryInput, PostResult } from './ledger.types';
import type { LedgerAdjustmentDtoType, LedgerQueryDtoType } from './dto';
import type { Prisma } from '@prisma/client';

// Entry types whose (type, account, reference) must be unique — mirrors the partial unique index in the migration.
const KEYED_TYPES = new Set(['WALLET_TOPUP', 'BOOKING_DEBIT', 'CREDIT_LINE_DRAW', 'REFUND_CREDIT', 'COMMISSION_CREDIT', 'CREDIT_LINE_REPAYMENT', 'ADJUSTMENT']);

/** Each entry type may only move the balance/direction it is named for. */
const assertShape = (i: PostEntryInput): void => {
  const ok =
    (i.entryType === 'WALLET_TOPUP' && i.account === 'WALLET' && i.direction === 'CREDIT') ||
    (i.entryType === 'BOOKING_DEBIT' && i.account === 'WALLET' && i.direction === 'DEBIT') ||
    (i.entryType === 'CREDIT_LINE_DRAW' && i.account === 'CREDIT' && i.direction === 'DEBIT') ||
    (i.entryType === 'CREDIT_LINE_REPAYMENT' && i.account === 'CREDIT' && i.direction === 'CREDIT') ||
    (i.entryType === 'COMMISSION_CREDIT' && i.account === 'WALLET' && i.direction === 'CREDIT') ||
    (i.entryType === 'REFUND_CREDIT' && i.direction === 'CREDIT') ||
    i.entryType === 'ADJUSTMENT';
  if (!ok) throw ApiError.internal(`Invalid ledger entry shape: ${i.entryType}/${i.account}/${i.direction}`);
};

export const assertUsdSettlement = (partner: LockedPartner): void => {
  if (partner.currency !== BASE_CATALOG_CURRENCY) {
    throw new ApiError(409, `Wallet and credit settle in ${BASE_CATALOG_CURRENCY}; this agency's currency is ${partner.currency} (multi-currency settlement is not supported yet)`);
  }
};

export class B2BLedgerService {
  constructor(private repository: B2BFinanceRepository) {}

  /**
   * The single way money moves. MUST be called inside a FinanceTx with `partner` freshly read by
   * `tx.lockPartner` (so the row is locked). Validates, applies the exact new balances, appends an
   * immutable entry, and decides the 80% alert. Returns the new partner state to chain further postings.
   */
  async post(tx: FinanceTx, partner: LockedPartner, input: PostEntryInput): Promise<PostResult> {
    assertShape(input);
    const amount = round2(input.amount);
    if (!amount.equals(input.amount) || amount.lte(0)) throw ApiError.badRequest('Amount must be positive with at most 2 decimals');

    // Idempotent replay (the partner lock makes check-then-insert safe; the unique index is the backstop).
    if (input.referenceId && input.referenceType && KEYED_TYPES.has(input.entryType)) {
      const existing = await tx.findLedgerEntry(input.entryType, input.account, input.referenceType, input.referenceId);
      if (existing) return { partner, entryId: existing.id, replayed: true, alert: null };
    }

    let wallet = partner.walletBalance;
    let used = partner.creditUsed;
    if (input.account === 'WALLET') {
      if (input.direction === 'DEBIT') {
        if (wallet.lt(amount)) throw new ApiError(402, 'Insufficient wallet balance');
        wallet = wallet.minus(amount);
      } else {
        wallet = wallet.plus(amount);
      }
    } else if (input.direction === 'DEBIT') {
      if (partner.creditLimit.lte(0) || used.plus(amount).gt(partner.creditLimit)) throw new ApiError(402, 'Insufficient available credit');
      used = used.plus(amount);
    } else {
      if (amount.gt(used)) throw new ApiError(409, 'Amount exceeds the credit currently in use');
      used = used.minus(amount);
    }

    const action = input.account === 'CREDIT'
      ? evaluateCreditAlert({ sentAt: partner.creditAlertSentAt, used, limit: partner.creditLimit, canSend: input.direction === 'DEBIT' })
      : 'NONE';
    const alertSentAt = action === 'SEND' ? new Date() : action === 'RESET' ? null : partner.creditAlertSentAt;

    const entry = await tx.insertLedgerEntry({
      partnerId: partner.id,
      account: input.account,
      direction: input.direction,
      entryType: input.entryType,
      amount,
      currency: partner.currency,
      balanceAfter: wallet,
      creditUsedAfter: used,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      description: input.description ?? null,
      createdById: input.createdById ?? null,
    });
    await tx.applyBalances(partner.id, { walletBalance: wallet, creditUsed: used, creditAlertSentAt: alertSentAt });

    let alert: CreditAlertEvent | null = null;
    if (action === 'SEND') {
      alert = { partnerId: partner.id, creditUsed: used, creditLimit: partner.creditLimit, utilizationPct: utilizationPct(used, partner.creditLimit) };
      // The in-app/admin notification: shows up in the Activity Log and the partner's wallet banner.
      await tx.audit(buildAuditEntry({
        actorType: 'system', actorId: 'credit-monitor', action: 'credit.alert_raised', title: 'Credit utilization reached 80%',
        category: 'b2b_partner', categoryId: partner.id,
        data: { creditUsed: used.toString(), creditLimit: partner.creditLimit.toString(), utilizationPct: alert.utilizationPct.toString() },
      }));
    } else if (action === 'RESET') {
      await tx.audit(buildAuditEntry({
        actorType: 'system', actorId: 'credit-monitor', action: 'credit.alert_reset', title: 'Credit utilization alert re-armed',
        category: 'b2b_partner', categoryId: partner.id, data: { creditUsed: used.toString(), creditLimit: partner.creditLimit.toString() },
      }));
    }

    return {
      partner: { ...partner, walletBalance: wallet, creditUsed: used, creditAlertSentAt: alertSentAt },
      entryId: entry.id,
      replayed: false,
      alert,
    };
  }

  /** Email side of the credit alert. Call only AFTER the transaction committed; never throws. */
  async deliverCreditAlerts(alerts: CreditAlertEvent[]): Promise<void> {
    for (const a of alerts) {
      try {
        const [partner, recipients] = await Promise.all([this.repository.findPartnerContact(a.partnerId), this.repository.findFinanceRecipients(a.partnerId)]);
        const to = [...new Set([...recipients, ...(mailConfig.adminEmail ? [mailConfig.adminEmail] : [])])];
        const name = partner?.legalName ?? 'A partner agency';
        const html = `<p>${name} has used <strong>${a.utilizationPct.toString()}%</strong> of its credit line `
          + `(${a.creditUsed.toString()} of ${a.creditLimit.toString()}).</p><p>Please arrange repayment or review the credit limit.</p>`;
        for (const addr of to) void sendMail({ to: addr, subject: `Credit utilization alert — ${name}`, html });
      } catch {
        // alerting must never fail the booking that triggered it
      }
    }
  }

  // ── Wallet top-up settlement (called when a top-up Payment succeeds) ─────

  /**
   * Credits the wallet for a successful top-up payment — exactly once. Safe to call any number of
   * times, concurrently, from webhooks or manual status changes: the payment is re-read from the DB
   * under the partner lock and the posting is keyed on the payment id.
   */
  async creditWalletForPayment(paymentId: string): Promise<{ credited: boolean }> {
    const outcome = await this.repository.withTransaction(async (tx) => {
      const probe = await tx.findPayment(paymentId);
      if (!probe?.b2bPartnerId || probe.bookingId) return { credited: false, alerts: [] as CreditAlertEvent[] };

      const partner = await tx.lockPartner(probe.b2bPartnerId);
      if (!partner) return { credited: false, alerts: [] };
      const payment = await tx.findPayment(paymentId); // fresh, under the lock
      if (!payment || payment.status !== 'SUCCESS' || payment.deletedAt) return { credited: false, alerts: [] };

      assertUsdSettlement(partner);
      const res = await this.post(tx, partner, {
        account: 'WALLET', direction: 'CREDIT', entryType: 'WALLET_TOPUP', amount: new Dec(payment.totalAmount.toString()),
        referenceType: 'PAYMENT', referenceId: payment.id, description: 'Wallet top-up',
      });
      if (!res.replayed) {
        await tx.audit(buildAuditEntry({
          actorType: 'system', actorId: 'payment-webhook', action: 'wallet.topup_credited', title: 'Wallet topped up',
          category: 'b2b_partner', categoryId: partner.id, data: { paymentId: payment.id, amount: payment.totalAmount.toString(), ledgerEntryId: res.entryId },
        }));
      }
      return { credited: !res.replayed, alerts: [] };
    });
    return { credited: outcome.credited };
  }

  // ── Admin: manual adjustments / repayments / credit limit ────────────────

  async adminAdjust(adminId: string, partnerId: string, dto: LedgerAdjustmentDtoType) {
    const result = await this.repository.withTransaction(async (tx) => {
      const partner = await tx.lockPartner(partnerId);
      if (!partner) throw new ApiError(404, 'Partner not found');

      if (dto.kind === 'CREDIT_LIMIT') {
        if (dto.creditLimit.lt(partner.creditUsed)) throw new ApiError(409, 'Credit limit cannot be lower than the credit already in use');
        const raised = dto.creditLimit.gt(partner.creditLimit);
        const action = evaluateCreditAlert({ sentAt: partner.creditAlertSentAt, used: partner.creditUsed, limit: dto.creditLimit, canSend: false, limitRaised: raised });
        await tx.applyBalances(partner.id, {
          walletBalance: partner.walletBalance, creditUsed: partner.creditUsed, creditLimit: dto.creditLimit,
          creditAlertSentAt: action === 'RESET' ? null : partner.creditAlertSentAt,
        });
        if (action === 'RESET') {
          await tx.audit(buildAuditEntry({
            actorType: 'system', actorId: 'credit-monitor', action: 'credit.alert_reset', title: 'Credit utilization alert re-armed',
            category: 'b2b_partner', categoryId: partner.id, data: { creditUsed: partner.creditUsed.toString(), creditLimit: dto.creditLimit.toString(), cause: 'limit_change' },
          }));
        }
        // A limit change moves no money, so it is an ActivityLog event, not a ledger row (ledger sums must keep reconciling).
        await tx.audit(buildAuditEntry({
          actorType: 'admin', actorId: adminId, action: 'ledger.credit_limit_updated', title: 'Credit limit updated', category: 'b2b_partner', categoryId: partner.id,
          data: { from: partner.creditLimit.toString(), to: dto.creditLimit.toString(), reason: dto.description },
        }));
        return { entryId: null as string | null, alerts: [] as CreditAlertEvent[] };
      }

      const input: PostEntryInput = dto.kind === 'ADJUSTMENT'
        ? { account: dto.account, direction: dto.direction, entryType: 'ADJUSTMENT', amount: dto.amount, description: dto.description }
        : { account: 'CREDIT', direction: 'CREDIT', entryType: 'CREDIT_LINE_REPAYMENT', amount: dto.amount, description: dto.description ?? 'Credit line repayment' };
      const res = await this.post(tx, partner, { ...input, referenceType: undefined, createdById: adminId });
      await tx.audit(buildAuditEntry({
        actorType: 'admin', actorId: adminId, action: 'ledger.adjustment', title: dto.kind === 'ADJUSTMENT' ? 'Manual ledger adjustment' : 'Credit line repayment recorded',
        category: 'b2b_partner', categoryId: partner.id,
        data: { kind: dto.kind, ledgerEntryId: res.entryId, amount: dto.amount.toString(), ...(dto.kind === 'ADJUSTMENT' ? { account: dto.account, direction: dto.direction } : {}) },
      }));
      return { entryId: res.entryId, alerts: res.alert ? [res.alert] : [] };
    });
    await this.deliverCreditAlerts(result.alerts);
    return this.summary(partnerId, result.entryId);
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  async summary(partnerId: string, lastEntryId: string | null = null) {
    const p = await this.repository.findPartnerFinance(partnerId);
    if (!p) throw new ApiError(404, 'Partner not found');
    const util = utilizationPct(p.creditUsed, p.creditLimit);
    return {
      lastEntryId,
      currency: p.currency,
      walletBalance: p.walletBalance,
      creditLimit: p.creditLimit,
      creditUsed: p.creditUsed,
      creditAvailable: availableCredit(p),
      creditEnabled: p.creditLimit.gt(0),
      utilizationPct: util,
      alert: {
        thresholdPct: CREDIT_ALERT_THRESHOLD.times(100),
        atOrAboveThreshold: p.creditLimit.gt(0) && util.gte(CREDIT_ALERT_THRESHOLD.times(100)),
        raised: p.creditAlertSentAt !== null,
        raisedAt: p.creditAlertSentAt,
      },
    };
  }

  async listLedger(partnerId: string, dto: LedgerQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.B2BLedgerEntryWhereInput = {
      ...(dto.entryType ? { entryType: dto.entryType } : {}),
      ...(dto.account ? { account: dto.account } : {}),
      ...(dto.from || dto.to ? { createdAt: { ...(dto.from ? { gte: dto.from } : {}), ...(dto.to ? { lte: dto.to } : {}) } } : {}),
    };
    const { items, total } = await this.repository.listLedger(partnerId, where, pagination.skip, pagination.take);
    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }
}
