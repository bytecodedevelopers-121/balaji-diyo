import type { LedgerAccount, LedgerDirection } from '@prisma/client';
import { Dec, ZERO, round2 } from '../b2b-common/b2b-money';

const DAY_MS = 86_400_000;

/**
 * Default cancellation schedule (share of the amount paid that is retained), by whole days
 * between cancellation and departure. Admins can override the penalty per cancellation.
 */
export const CANCELLATION_SCHEDULE: readonly { minDays: number; penaltyPct: number }[] = [
  { minDays: 30, penaltyPct: 0 },
  { minDays: 15, penaltyPct: 25 },
  { minDays: 7, penaltyPct: 50 },
  { minDays: 0, penaltyPct: 100 },
];

export const daysUntil = (start: Date, now: Date): number => Math.floor((start.getTime() - now.getTime()) / DAY_MS);

export const penaltyPctFor = (days: number): number =>
  CANCELLATION_SCHEDULE.find((s) => days >= s.minDays)?.penaltyPct ?? 100;

export interface Settlement {
  /** Net amounts currently settled through each account (debits minus refunds). */
  wallet: Dec;
  credit: Dec;
  walletPaid: Dec;
  creditDrawn: Dec;
  refunded: Dec;
}

interface LedgerRow { account: LedgerAccount; direction: LedgerDirection; amount: Dec }

export const summariseSettlement = (rows: LedgerRow[]): Settlement => {
  let wallet = ZERO, credit = ZERO, walletPaid = ZERO, creditDrawn = ZERO, refunded = ZERO;
  for (const r of rows) {
    const amount = new Dec(r.amount.toString());
    const signed = r.direction === 'DEBIT' ? amount : amount.negated();
    if (r.account === 'WALLET') wallet = wallet.plus(signed); else credit = credit.plus(signed);
    if (r.direction === 'DEBIT') { if (r.account === 'WALLET') walletPaid = walletPaid.plus(amount); else creditDrawn = creditDrawn.plus(amount); }
    else refunded = refunded.plus(amount);
  }
  return { wallet, credit, walletPaid, creditDrawn, refunded };
};

/**
 * Splits a refund back across wallet/credit in proportion to how the booking was settled.
 * The credit share is capped at the credit currently in use (excess goes to the wallet) so a
 * refund can never push creditUsed below zero.
 */
export const allocateRefund = (amount: Dec, settled: Settlement, creditUsedNow: Dec): { wallet: Dec; credit: Dec } => {
  const total = settled.wallet.plus(settled.credit);
  if (amount.lte(0)) return { wallet: ZERO, credit: ZERO };
  if (total.lte(0) || settled.credit.lte(0)) return { wallet: amount, credit: ZERO };
  const walletShare = round2(amount.times(settled.wallet).dividedBy(total));
  const credit = Dec.min(amount.minus(walletShare), creditUsedNow);
  return { wallet: amount.minus(credit), credit };
};
