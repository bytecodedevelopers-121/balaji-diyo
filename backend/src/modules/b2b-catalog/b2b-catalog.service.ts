import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { B2BCatalogRepository } from './b2b-catalog.repository';
import { B2BPricingRepository } from '../b2b-pricing/b2b-pricing.repository';
import { computeAvailability } from '../b2b-inventory/availability';
import { findApplicableContract, isDepartureBookable, resolveRate } from '../b2b-pricing/pricing.engine';
import type { ContractData, DepartureData, PackageData, PriceGroupData, RateResult, TierData } from '../b2b-pricing/pricing.types';
import type { Dec } from '../b2b-common/b2b-money';
import type { AllotmentSeats, DepartureSeats } from '../b2b-inventory/availability';
import type { ListCatalogQueryDtoType } from './dto';

interface DepartureRow extends DepartureSeats {
  id: string;
  departureCost: Dec;
  departureStatus: string;
  cutoffHours: number;
  allotments: AllotmentSeats[];
}

const toDepartureData = (d: DepartureRow): DepartureData => ({
  departureDate: d.departureDate, departureCost: d.departureCost, cutoffHours: d.cutoffHours, departureStatus: d.departureStatus,
});

/** Compact rate for catalog display — at the contract's minimum party size (or 1). */
const rateSummary = (r: RateResult) => ({
  rateSource: r.rateSource, rateType: r.rateType, currency: r.currency, paxCount: r.paxCount, unitPrice: r.unitPrice,
  commissionPct: r.commissionPct, commissionAmount: r.commissionAmount, netPayable: r.netPayable, grossAmount: r.grossAmount,
  eligible: r.eligible, reasons: r.reasons,
});

export class B2BCatalogService {
  constructor(
    private repository: B2BCatalogRepository,
    private pricing: B2BPricingRepository,
  ) {}

  private async partnerTier(partnerId: string): Promise<TierData> {
    const partner = await this.pricing.findPartnerWithTier(partnerId);
    if (!partner) throw new ApiError(404, 'Partner not found');
    if (partner.status !== 'ACTIVE') throw new ApiError(403, 'Partner account is not active');
    return partner.tier;
  }

  private departureView(
    d: DepartureRow, partnerId: string, tier: TierData, pkg: PackageData, groups: PriceGroupData[], contracts: ContractData[], now: Date,
  ) {
    const contract = findApplicableContract(contracts, d.departureDate);
    const rate = resolveRate({
      tier, pkg, priceGroups: groups, contracts, departure: toDepartureData(d), travelDate: d.departureDate,
      paxCount: Math.max(1, contract?.minPax ?? 1), agentMarkup: null, now,
    });
    const availability = computeAvailability(d, d.allotments, partnerId, now);
    return {
      id: d.id,
      departureDate: d.departureDate,
      departureStatus: d.departureStatus,
      bookable: isDepartureBookable(toDepartureData(d), now) && rate.eligible && (availability.available === null || availability.available > 0),
      cutoffAt: rate.cutoffAt,
      // Computed numbers only — other partners' allotments are never exposed.
      availability: { capacityTracked: availability.available !== null, available: availability.available, source: availability.source, allotmentReleaseAt: availability.allotmentReleaseAt },
      rate: rateSummary(rate),
    };
  }

  async list(partnerId: string, dto: ListCatalogQueryDtoType) {
    const tier = await this.partnerTier(partnerId);
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const now = new Date();
    const { items, total } = await this.repository.findPackagesPage(dto.q, pagination.skip, pagination.take, now);
    const contractRows = await this.pricing.findActiveContracts(partnerId, items.map((p) => p.id));

    const rows = items.map((p) => {
      const contracts = contractRows.filter((c) => c.packageId === p.id).map((c) => c.contract);
      const next = p.departures[0] ?? null;
      const travelDate = next?.departureDate ?? now;
      const contract = findApplicableContract(contracts, travelDate);
      const rate = resolveRate({
        tier, pkg: p, priceGroups: p.priceGroups, contracts, departure: next ? toDepartureData(next) : null, travelDate,
        paxCount: Math.max(1, contract?.minPax ?? 1), agentMarkup: null, now,
      });
      const { priceGroups: _pg, departures: _d, _count, discount: _disc, ...summary } = p;
      return {
        ...summary,
        hasContract: contracts.length > 0,
        upcomingDepartures: _count.departures,
        nextDeparture: next ? this.departureView(next, partnerId, tier, p, p.priceGroups, contracts, now) : null,
        rate: rateSummary(rate),
      };
    });
    return PaginationDto.create({ items: rows, page: pagination.page, perPage: pagination.perPage, total });
  }

  async detail(partnerId: string, packageId: string) {
    const tier = await this.partnerTier(partnerId);
    const pkg = await this.repository.findPackageDetail(packageId);
    if (!pkg) throw new ApiError(404, 'Package not found');
    const now = new Date();
    const [departures, contractRows] = await Promise.all([
      this.repository.findUpcomingDepartures(pkg.id, now),
      this.pricing.findActiveContracts(partnerId, [pkg.id]),
    ]);
    const contracts = contractRows.map((c) => c.contract);
    const { discount: _disc, ...publicFields } = pkg;
    return {
      ...publicFields,
      // The partner's OWN contracts only (query is scoped by partnerId).
      contracts: contracts.map((c) => ({
        id: c.id, rateType: c.rateType, netUnitPrice: c.netUnitPrice, commissionPct: c.commissionPct, validFrom: c.validFrom, validTo: c.validTo,
        blackoutDates: c.blackoutDates, minPax: c.minPax, maxPax: c.maxPax, cutoffHours: c.cutoffHours,
      })),
      tier: { defaultRateType: tier.defaultRateType, defaultCommissionPct: tier.defaultCommissionPct },
      departures: departures.map((d) => this.departureView(d, partnerId, tier, pkg, pkg.priceGroups, contracts, now)),
    };
  }
}
