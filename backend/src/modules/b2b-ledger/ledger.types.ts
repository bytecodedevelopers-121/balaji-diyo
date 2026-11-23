import type { B2BPartnerStatus, LedgerAccount, LedgerDirection, LedgerEntryType } from '@prisma/client';
import type { Dec } from '../b2b-common/b2b-money';

/** Partner financial state as read under `SELECT … FOR UPDATE`. */
export interface LockedPartner {
  id: string;
  status: B2BPartnerStatus;
  currency: string;
  walletBalance: Dec;
  creditLimit: Dec;
  creditUsed: Dec;
  creditAlertSentAt: Date | null;
}

export interface PostEntryInput {
  account: LedgerAccount;
  direction: LedgerDirection;
  entryType: LedgerEntryType;
  amount: Dec;
  referenceType?: 'BOOKING' | 'PAYMENT' | 'CUSTOM_BOOKING' | 'INVOICE' | 'AMENDMENT' | 'SETTLEMENT';
  referenceId?: string;
  description?: string;
  createdById?: string;
}

export type FundingMethod = 'WALLET' | 'CREDIT' | 'WALLET_THEN_CREDIT';

export interface FundingPlan { wallet: Dec; credit: Dec }

export type CreditAlertEvent = { partnerId: string; creditUsed: Dec; creditLimit: Dec; utilizationPct: Dec };

/** What committed work the caller must do after the transaction (emails etc. never run inside it). */
export interface PostResult {
  partner: LockedPartner;
  entryId: string | null; // null when an idempotent replay found an existing entry
  replayed: boolean;
  alert: CreditAlertEvent | null;
}
