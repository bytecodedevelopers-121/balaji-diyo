import { Prisma, B2BBookingStatus } from '@prisma/client';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { Dec, ZERO, round2 } from '../b2b-common/b2b-money';
import { B2BFinanceRepository } from '../b2b-finance/b2b-finance.repository';
import { B2BLedgerService } from '../b2b-ledger/b2b-ledger.service';
import { availableCredit } from '../b2b-ledger/credit.policy';
import { B2BSettlementRepository } from './b2b-settlement.repository';
import type { Period, RecordSettlementDtoType } from './dto';

const EXPORT_LIMIT = 10_000;
const STATUSES: B2BBookingStatus[] = ['CONFIRMED', 'AMENDMENT_REQUESTED', 'PENDING_APPROVAL', 'CANCELLED'];
const dec = (v: Prisma.Decimal | null | undefined): Dec => (v ? new Dec(v.toString()) : ZERO);

/** Neutralises spreadsheet formula injection and quotes fields that need it. */
const csvCell = (value: string | number | null | undefined): string => {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export class B2BSettlementService {
  constructor(
    private repository: B2BSettlementRepository,
    private finance: B2BFinanceRepository,
    private ledger: B2BLedgerService,
  ) {}

  /** Reconciliation for one partner and period. All money is Decimal. */
  async summary(partnerId: string, period: Period) {
    const partner = await this.finance.findPartnerFinance(partnerId);
    if (!partner) throw new ApiError(404, 'Partner not found');
    const { from, to } = period;

    const [bookingGroups, ledgerGroups, opening, closing, cancelled] = await Promise.all([
      this.repository.groupBookings(partnerId, from, to),
      this.repository.groupLedger(partnerId, from, to),
      this.repository.lastEntry(partnerId, { before: from }),
      this.repository.lastEntry(partnerId, { atOrBefore: to }),
      this.repository.cancelledBookings(partnerId, from, to),
    ]);

    // Bookings created in the period, by status.
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, { count: 0, grossClientPrice: ZERO, netPayable: ZERO, commission: ZERO, agentMarkup: ZERO }])) as Record<string, { count: number; grossClientPrice: Dec; netPayable: Dec; commission: Dec; agentMarkup: Dec }>;
    for (const g of bookingGroups) {
      if (!g.b2bStatus || !byStatus[g.b2bStatus]) continue;
      byStatus[g.b2bStatus] = { count: g._count._all, grossClientPrice: dec(g._sum.totalPrice), netPayable: dec(g._sum.netPayable), commission: dec(g._sum.commissionAmount), agentMarkup: dec(g._sum.agentMarkup) };
    }

    // Cancelled-and-paid bookings: refunded vs retained, and the share of commission that was reversed.
    const movements = await this.repository.ledgerForBookings(cancelled.map((c) => c.id));
    let commissionReversed = ZERO;
    let commissionOfCancelledPaid = ZERO; // commission was earned when these were booked, then (partly) reversed
    let penaltiesRetained = ZERO;
    for (const c of cancelled) {
      const mine = movements.filter((m) => m.bookingId === c.id);
      const paid = mine.filter((m) => m.direction === 'DEBIT').reduce((a, m) => a.plus(dec(m.amount)), ZERO);
      const refunded = mine.filter((m) => m.direction === 'CREDIT').reduce((a, m) => a.plus(dec(m.amount)), ZERO);
      if (paid.lte(0)) continue; // never charged (e.g. rejected request): no commission was ever earned
      commissionOfCancelledPaid = commissionOfCancelledPaid.plus(dec(c.commissionAmount));
      commissionReversed = commissionReversed.plus(round2(dec(c.commissionAmount).times(Dec.min(refunded.dividedBy(paid), new Dec(1)))));
      penaltiesRetained = penaltiesRetained.plus(Dec.max(paid.minus(refunded), ZERO));
    }
    const activeStatuses = ['CONFIRMED', 'AMENDMENT_REQUESTED'] as const;
    const commissionEarned = activeStatuses.reduce((a, s) => a.plus((byStatus[s] as { commission: Dec }).commission), ZERO).plus(commissionOfCancelledPaid);
    const markupTotal = activeStatuses.reduce((a, s) => a.plus((byStatus[s] as { agentMarkup: Dec }).agentMarkup), ZERO);

    // Ledger movements in the period.
    let walletNet = ZERO;
    let creditNet = ZERO;
    const byType = ledgerGroups.map((g) => {
      const amount = dec(g._sum.amount);
      const signed = g.direction === 'CREDIT' ? amount : amount.negated();
      if (g.account === 'WALLET') walletNet = walletNet.plus(signed); else creditNet = creditNet.minus(signed); // credit account: DEBIT raises creditUsed
      return { entryType: g.entryType, account: g.account, direction: g.direction, count: g._count._all, amount };
    });
    const sum = (types: string[], dir?: 'DEBIT' | 'CREDIT') => byType.filter((r) => types.includes(r.entryType) && (!dir || r.direction === dir)).reduce((a, r) => a.plus(r.amount), ZERO);

    const openingWallet = dec(opening?.balanceAfter);
    const openingCredit = dec(opening?.creditUsedAfter);
    const closingWallet = dec(closing?.balanceAfter);
    const closingCredit = dec(closing?.creditUsedAfter);

    return {
      period: { from, to },
      currency: partner.currency,
      bookings: {
        byStatus,
        totals: {
          count: STATUSES.reduce((a, s) => a + (byStatus[s] as { count: number }).count, 0),
          grossClientPrice: activeStatuses.reduce((a, s) => a.plus((byStatus[s] as { grossClientPrice: Dec }).grossClientPrice), ZERO),
          netPayable: activeStatuses.reduce((a, s) => a.plus((byStatus[s] as { netPayable: Dec }).netPayable), ZERO),
        },
      },
      commission: { earned: commissionEarned, reversed: commissionReversed, net: commissionEarned.minus(commissionReversed) },
      agentMarkup: markupTotal,
      ledger: {
        byType,
        topUps: sum(['WALLET_TOPUP'], 'CREDIT'),
        bookingDebits: sum(['BOOKING_DEBIT', 'CREDIT_LINE_DRAW'], 'DEBIT'),
        refunds: sum(['REFUND_CREDIT'], 'CREDIT'),
        repayments: sum(['CREDIT_LINE_REPAYMENT'], 'CREDIT'),
        commissionPayouts: sum(['COMMISSION_CREDIT'], 'CREDIT'),
        adjustmentsNet: sum(['ADJUSTMENT'], 'CREDIT').minus(sum(['ADJUSTMENT'], 'DEBIT')),
        cancellationPenaltiesRetained: penaltiesRetained,
      },
      position: {
        opening: { wallet: openingWallet, creditUsed: openingCredit },
        closing: { wallet: closingWallet, creditUsed: closingCredit },
        movement: { wallet: walletNet, creditUsed: creditNet },
        // The statement is only trustworthy if opening + movement == closing for both balances.
        reconciles: openingWallet.plus(walletNet).equals(closingWallet) && openingCredit.plus(creditNet).equals(closingCredit),
        current: { wallet: partner.walletBalance, creditLimit: partner.creditLimit, creditUsed: partner.creditUsed, creditAvailable: availableCredit(partner) },
      },
    };
  }

  /** CSV statement of every ledger entry in the period, oldest first, with running balances. */
  async exportCsv(partnerId: string, period: Period): Promise<{ csv: string; truncated: boolean }> {
    const partner = await this.finance.findPartnerFinance(partnerId);
    if (!partner) throw new ApiError(404, 'Partner not found');
    const rows = await this.repository.ledgerRows(partnerId, period.from, period.to, EXPORT_LIMIT + 1);
    const truncated = rows.length > EXPORT_LIMIT;
    const header = ['date_utc', 'entry_id', 'type', 'account', 'direction', 'amount', 'currency', 'wallet_balance_after', 'credit_used_after', 'reference_type', 'reference_id', 'description'];
    const lines = rows.slice(0, EXPORT_LIMIT).map((r) =>
      [r.createdAt.toISOString(), r.id, r.entryType, r.account, r.direction, r.amount.toString(), r.currency, r.balanceAfter.toString(), r.creditUsedAfter.toString(), r.referenceType, r.referenceId, r.description].map(csvCell).join(','),
    );
    return { csv: [header.join(','), ...lines].join('\r\n') + '\r\n', truncated };
  }

  // ── admin ─────────────────────────────────────────────────────────────────
  async adminOverview(period: Period, page: number, perPage: number) {
    const pagination = new PaginationQueryDto({ page, perPage });
    const { partners, total, grouped } = await this.repository.overview(period.from, period.to, pagination.skip, pagination.take);
    const items = partners.map((p) => {
      const mine = grouped.filter((g) => g.partnerId === p.id);
      const sum = (types: string[]) => mine.filter((g) => types.includes(g.entryType)).reduce((a, g) => a.plus(dec(g._sum.amount)), ZERO);
      return {
        ...p, creditAvailable: availableCredit(p),
        period: { topUps: sum(['WALLET_TOPUP']), bookingDebits: sum(['BOOKING_DEBIT', 'CREDIT_LINE_DRAW']), refunds: sum(['REFUND_CREDIT']), repayments: sum(['CREDIT_LINE_REPAYMENT']), commissionPayouts: sum(['COMMISSION_CREDIT']) },
      };
    });
    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  /**
   * Records a repayment / commission payout / adjustment as one immutable ledger entry. A supplied
   * `settlementRef` is a idempotency key: re-sending the same request returns the original result.
   */
  async record(adminId: string, partnerId: string, dto: RecordSettlementDtoType, period: Period) {
    const out = await this.finance.withTransaction(async (tx) => {
      const partner = await tx.lockPartner(partnerId);
      if (!partner) throw new ApiError(404, 'Partner not found');
      const base = dto.settlementRef ? { referenceType: 'SETTLEMENT' as const, referenceId: dto.settlementRef } : {};
      const res = await this.ledger.post(tx, partner, {
        ...(dto.kind === 'CREDIT_LINE_REPAYMENT'
          ? { account: 'CREDIT' as const, direction: 'CREDIT' as const, entryType: 'CREDIT_LINE_REPAYMENT' as const, description: dto.description ?? 'Credit line repayment' }
          : dto.kind === 'COMMISSION_CREDIT'
            ? { account: 'WALLET' as const, direction: 'CREDIT' as const, entryType: 'COMMISSION_CREDIT' as const, description: dto.description }
            : { account: dto.account, direction: dto.direction, entryType: 'ADJUSTMENT' as const, description: dto.description }),
        amount: dto.amount, createdById: adminId, ...base,
      });
      if (!res.replayed) {
        await tx.audit(buildAuditEntry({
          actorType: 'admin', actorId: adminId, action: 'settlement.recorded', title: `Settlement recorded: ${dto.kind}`, category: 'b2b_partner', categoryId: partnerId,
          data: { kind: dto.kind, amount: dto.amount.toString(), ledgerEntryId: res.entryId, settlementRef: dto.settlementRef ?? null },
        }));
      }
      return { replayed: res.replayed, entryId: res.entryId, alerts: res.alert ? [res.alert] : [] };
    });
    await this.ledger.deliverCreditAlerts(out.alerts);
    return { replayed: out.replayed, ledgerEntryId: out.entryId, summary: await this.summary(partnerId, period) };
  }
}
