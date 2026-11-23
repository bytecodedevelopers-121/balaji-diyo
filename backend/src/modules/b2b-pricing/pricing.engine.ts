import { BASE_CATALOG_CURRENCY, Dec, ZERO, round2, utcDay } from '../b2b-common/b2b-money';
import type { ContractData, DepartureData, PolicyIssue, PriceGroupData, RateInput, RateResult, RateSource } from './pricing.types';

const HOUR_MS = 3_600_000;
const NON_BOOKABLE_STATUSES = new Set(['closed', 'cancelled', 'canceled', 'sold out', 'sold_out', 'soldout', 'full']);

export const isDepartureBookable = (d: DepartureData, now: Date): boolean =>
  d.departureDate.getTime() > now.getTime() && !NON_BOOKABLE_STATUSES.has(d.departureStatus.trim().toLowerCase());

/** Contract covering `travelDate` (UTC calendar days, inclusive). Overlaps are rejected at write time; latest start wins defensively. */
export const findApplicableContract = (contracts: ContractData[], travelDate: Date): ContractData | null => {
  const day = utcDay(travelDate);
  return (
    contracts
      .filter((c) => utcDay(c.validFrom) <= day && day <= utcDay(c.validTo))
      .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0] ?? null
  );
};

export interface PolicyEvaluation {
  reasons: PolicyIssue[];
  cutoffAt: Date | null;
  cutoffHours: number | null;
}

/** Contract/departure policy shared by quotes and holds: blackout, pax bounds, bookable status, cut-off. */
export const evaluatePolicy = (p: {
  contract: ContractData | null;
  departure: DepartureData | null;
  travelDate: Date;
  paxCount: number;
  now: Date;
}): PolicyEvaluation => {
  const reasons: PolicyIssue[] = [];
  const { contract, departure } = p;

  if (!Number.isInteger(p.paxCount) || p.paxCount < 1) {
    reasons.push({ code: 'INVALID_PAX', message: 'paxCount must be at least 1' });
  }

  if (contract) {
    const day = utcDay(p.travelDate);
    const hit = contract.blackoutDates.find((r) => r.start <= day && day <= r.end);
    if (hit) reasons.push({ code: 'BLACKOUT', message: `Travel date falls in a contract blackout period (${hit.start} to ${hit.end})` });
    if (contract.minPax !== null && p.paxCount < contract.minPax) {
      reasons.push({ code: 'PAX_BELOW_MIN', message: `Contract requires at least ${contract.minPax} travellers` });
    }
    if (contract.maxPax !== null && p.paxCount > contract.maxPax) {
      reasons.push({ code: 'PAX_ABOVE_MAX', message: `Contract allows at most ${contract.maxPax} travellers` });
    }
  }

  if (departure && !isDepartureBookable(departure, p.now)) {
    reasons.push({ code: 'DEPARTURE_NOT_BOOKABLE', message: 'This departure is closed or has already left' });
  }

  const cutoffHours = contract?.cutoffHours ?? departure?.cutoffHours ?? null;
  let cutoffAt: Date | null = null;
  if (cutoffHours !== null) {
    cutoffAt = new Date((departure?.departureDate ?? p.travelDate).getTime() - cutoffHours * HOUR_MS);
    if (p.now.getTime() > cutoffAt.getTime()) {
      reasons.push({ code: 'CUTOFF_PASSED', message: `Booking cut-off (${cutoffHours}h before departure) has passed` });
    }
  }
  return { reasons, cutoffAt, cutoffHours };
};

const pickPriceGroup = (groups: PriceGroupData[], pax: number): PriceGroupData | null =>
  groups
    .filter((g) => g.minPeople <= pax && pax <= g.maxPeople)
    // narrowest slab first (most specific), default flag breaks ties
    .sort((a, b) => a.maxPeople - a.minPeople - (b.maxPeople - b.minPeople) || Number(b.isDefault) - Number(a.isDefault))[0] ?? null;

const resolveBase = (i: RateInput): { unit: Dec; source: Exclude<RateSource, 'CONTRACT'> } => {
  const group = pickPriceGroup(i.priceGroups, i.paxCount);
  if (group) {
    const offer = group.offerUnitPrice && group.offerUnitPrice.greaterThan(0) ? group.offerUnitPrice : null;
    return { unit: round2(offer ?? group.unitPrice), source: 'TIER_PRICE_GROUP' };
  }
  if (i.departure && i.departure.departureCost.greaterThan(0)) {
    return { unit: round2(i.departure.departureCost), source: 'DEPARTURE_DEFAULT' };
  }
  // package.discount is a flat per-person amount; applied only when configured.
  const discount = i.pkg.discount && i.pkg.discount.greaterThan(0) ? i.pkg.discount : ZERO;
  const unit = i.pkg.price.minus(discount);
  return { unit: round2(unit.isNegative() ? ZERO : unit), source: 'PACKAGE_DEFAULT' };
};

/** Deterministic, side-effect-free rate resolution. Ineligible results still carry the computed prices. */
export const resolveRate = (i: RateInput): RateResult => {
  const contract = findApplicableContract(i.contracts, i.travelDate);
  const policy = evaluatePolicy({ contract, departure: i.departure, travelDate: i.travelDate, paxCount: i.paxCount, now: i.now });
  const warnings: PolicyIssue[] = [];
  const base = resolveBase(i);
  const pax = new Dec(Math.max(1, i.paxCount));

  const rateType = contract?.rateType ?? i.tier.defaultRateType;
  const commissionPct =
    rateType === 'COMMISSIONABLE' ? (contract?.commissionPct ?? i.tier.defaultCommissionPct) : null;

  let unitPrice: Dec;
  let grossAmount: Dec;
  let commissionAmount = ZERO;
  let netPayable: Dec;

  if (rateType === 'NET') {
    if (contract) {
      unitPrice = round2(contract.netUnitPrice ?? base.unit);
    } else {
      // No contract: tier NET = list price less the tier's discount %.
      unitPrice = round2(base.unit.times(new Dec(100).minus(i.tier.defaultCommissionPct)).dividedBy(100));
      warnings.push({ code: 'NET_DERIVED_FROM_TIER', message: `Net rate derived from list price less ${i.tier.defaultCommissionPct.toString()}% tier discount` });
    }
    netPayable = round2(unitPrice.times(pax));
    grossAmount = netPayable;
  } else {
    unitPrice = base.unit;
    grossAmount = round2(unitPrice.times(pax));
    commissionAmount = round2(grossAmount.times(commissionPct ?? ZERO).dividedBy(100));
    netPayable = grossAmount.minus(commissionAmount);
  }

  // Markup is the agent's own margin on top; it never alters the base rate or commission.
  const markupTotal = i.agentMarkup
    ? round2(i.agentMarkup.mode === 'PER_PAX' ? i.agentMarkup.amount.times(pax) : i.agentMarkup.amount)
    : ZERO;
  const clientDisplayAmount = grossAmount.plus(markupTotal);

  if (!contract) warnings.push({ code: 'NO_CONTRACT', message: 'No contract applies on this date; tier pricing used' });
  if (base.unit.isZero()) warnings.push({ code: 'ZERO_PRICE', message: 'Resolved list price is zero — check package pricing' });

  return {
    eligible: policy.reasons.length === 0,
    reasons: policy.reasons,
    warnings,
    rateSource: contract ? 'CONTRACT' : base.source,
    baseRateSource: base.source,
    contractId: contract?.id ?? null,
    rateType,
    currency: BASE_CATALOG_CURRENCY,
    unitPrice,
    paxCount: i.paxCount,
    grossAmount,
    commissionPct,
    commissionAmount,
    netPayable,
    agentMarkup: markupTotal,
    clientDisplayAmount,
    cutoffAt: policy.cutoffAt,
    cutoffHours: policy.cutoffHours,
  };
};
