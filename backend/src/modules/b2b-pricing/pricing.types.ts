import type { B2BRateType } from '@prisma/client';
import type { Dec } from '../b2b-common/b2b-money';

export type RateSource = 'CONTRACT' | 'TIER_PRICE_GROUP' | 'DEPARTURE_DEFAULT' | 'PACKAGE_DEFAULT';
export type MarkupMode = 'PER_PAX' | 'TOTAL';

export type DateRange = { start: string; end: string }; // YYYY-MM-DD, inclusive

export interface ContractData {
  id: string;
  rateType: B2BRateType;
  netUnitPrice: Dec | null;
  commissionPct: Dec | null;
  validFrom: Date;
  validTo: Date;
  blackoutDates: DateRange[];
  minPax: number | null;
  maxPax: number | null;
  cutoffHours: number;
}

export interface PriceGroupData {
  minPeople: number;
  maxPeople: number;
  unitPrice: Dec;
  offerUnitPrice: Dec | null;
  isDefault: boolean;
}

export interface TierData { defaultRateType: B2BRateType; defaultCommissionPct: Dec }
export interface PackageData { price: Dec; discount: Dec | null }
export interface DepartureData { departureDate: Date; departureCost: Dec; cutoffHours: number; departureStatus: string }

export interface PolicyIssue { code: string; message: string }

export interface RateInput {
  tier: TierData;
  pkg: PackageData;
  priceGroups: PriceGroupData[];
  contracts: ContractData[]; // candidate (active) contracts for this partner + package
  departure: DepartureData | null;
  travelDate: Date;
  paxCount: number;
  agentMarkup: { amount: Dec; mode: MarkupMode } | null;
  now: Date;
}

export interface RateResult {
  eligible: boolean;
  reasons: PolicyIssue[]; // hard blockers
  warnings: PolicyIssue[]; // soft notices
  rateSource: RateSource;
  baseRateSource: Exclude<RateSource, 'CONTRACT'>;
  contractId: string | null;
  rateType: B2BRateType;
  currency: string;
  unitPrice: Dec; // NET: partner's net unit price; COMMISSIONABLE: gross list unit price
  paxCount: number;
  grossAmount: Dec; // NET: = netPayable; COMMISSIONABLE: list total
  commissionPct: Dec | null;
  commissionAmount: Dec;
  netPayable: Dec;
  agentMarkup: Dec; // total markup
  clientDisplayAmount: Dec; // what the partner's end client sees
  cutoffAt: Date | null;
  cutoffHours: number | null;
}
