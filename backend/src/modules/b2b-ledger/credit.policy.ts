import { Dec, ZERO, round2 } from '../b2b-common/b2b-money';
import { ApiError } from '../../common/exceptions/api-error';
import type { FundingMethod, FundingPlan, LockedPartner } from './ledger.types';

/** Alert when credit use reaches 80% of the limit; re-arm once it falls below 50% (or the limit is raised enough to drop under 80%). */
export const CREDIT_ALERT_THRESHOLD = new Dec('0.80');
export const CREDIT_ALERT_REARM_BELOW = new Dec('0.50');

export type AlertAction = 'SEND' | 'RESET' | 'NONE';

export const utilization = (used: Dec, limit: Dec): Dec => (limit.lte(0) ? ZERO : used.dividedBy(limit));

export const utilizationPct = (used: Dec, limit: Dec): Dec => round2(utilization(used, limit).times(100));

/**
 * Hysteresis keeps alerts timely without spamming: one SEND per crossing of 80%,
 * not repeated on every further booking, re-armed only after real recovery.
 * `canSend` is true only on credit draws; `limitRaised` re-arms after a limit increase.
 */
export const evaluateCreditAlert = (p: { sentAt: Date | null; used: Dec; limit: Dec; canSend: boolean; limitRaised?: boolean }): AlertAction => {
  if (p.limit.lte(0)) return p.sentAt ? 'RESET' : 'NONE';
  const ratio = utilization(p.used, p.limit);
  if (p.canSend && !p.sentAt && ratio.gte(CREDIT_ALERT_THRESHOLD)) return 'SEND';
  if (p.sentAt && (ratio.lt(CREDIT_ALERT_REARM_BELOW) || (p.limitRaised && ratio.lt(CREDIT_ALERT_THRESHOLD)))) return 'RESET';
  return 'NONE';
};

export const availableCredit = (p: Pick<LockedPartner, 'creditLimit' | 'creditUsed'>): Dec => {
  const free = p.creditLimit.minus(p.creditUsed);
  return free.isNegative() ? ZERO : free;
};

/**
 * How a charge is split between the prepaid wallet and the postpaid credit line.
 *  - WALLET:             the whole amount from the wallet.
 *  - CREDIT:             the whole amount drawn on the credit line (needs credit terms: creditLimit > 0).
 *  - WALLET_THEN_CREDIT: spend the wallet first, draw the remainder on credit.
 * Throws 402 when the chosen source(s) can't cover it. Nothing is mutated here.
 */
export const planFunding = (method: FundingMethod, partner: LockedPartner, amount: Dec): FundingPlan => {
  const credit = availableCredit(partner);
  if (method === 'WALLET') {
    if (partner.walletBalance.lt(amount)) throw new ApiError(402, 'Insufficient wallet balance');
    return { wallet: amount, credit: ZERO };
  }
  if (method === 'CREDIT') {
    if (partner.creditLimit.lte(0)) throw new ApiError(402, 'No credit line is configured for this agency');
    if (credit.lt(amount)) throw new ApiError(402, 'Insufficient available credit');
    return { wallet: ZERO, credit: amount };
  }
  const fromWallet = Dec.min(partner.walletBalance, amount);
  const remainder = amount.minus(fromWallet);
  if (remainder.gt(0)) {
    if (partner.creditLimit.lte(0)) throw new ApiError(402, 'Insufficient wallet balance and no credit line is configured');
    if (credit.lt(remainder)) throw new ApiError(402, 'Insufficient wallet balance and available credit');
  }
  return { wallet: fromWallet, credit: remainder };
};

export const paymentOptionsCode = (method: FundingMethod): string =>
  method === 'WALLET' ? 'B2B_WALLET' : method === 'CREDIT' ? 'B2B_CREDIT' : 'B2B_SPLIT';

export const fundingFromCode = (code: string | null | undefined): FundingMethod =>
  code === 'B2B_WALLET' ? 'WALLET' : code === 'B2B_CREDIT' ? 'CREDIT' : 'WALLET_THEN_CREDIT';
