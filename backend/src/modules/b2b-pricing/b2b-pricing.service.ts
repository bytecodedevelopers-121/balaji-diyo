import { ApiError } from '../../common/exceptions/api-error';
import { Dec } from '../b2b-common/b2b-money';
import { B2BPricingRepository } from './b2b-pricing.repository';
import { B2BInventoryService } from '../b2b-inventory/b2b-inventory.service';
import { resolveRate } from './pricing.engine';
import type { QuoteDtoType } from './dto';
import type { PolicyIssue } from './pricing.types';

const DAY_MS = 86_400_000;

export class B2BPricingService {
  constructor(
    private repository: B2BPricingRepository,
    private inventory: B2BInventoryService,
  ) {}

  /** Partner scope always comes from the session; price, commission and seat counts are never taken from the client. */
  async quote(partnerId: string, dto: QuoteDtoType) {
    const partner = await this.repository.findPartnerWithTier(partnerId);
    if (!partner) throw new ApiError(404, 'Partner not found');
    if (partner.status !== 'ACTIVE') throw new ApiError(403, 'Partner account is not active');

    const pkg = await this.repository.findPackage(dto.packageId);
    if (!pkg) throw new ApiError(404, 'Package not found');

    const departure = dto.departureId ? await this.repository.findDeparture(dto.departureId) : null;
    if (dto.departureId && (!departure || departure.packageId !== pkg.id)) {
      throw new ApiError(404, 'Departure not found for this package');
    }

    const travelDate = departure?.departureDate ?? dto.travelDate;
    if (!travelDate) throw new ApiError(400, 'travelDate is required when no departureId is given');
    if (departure && dto.travelDate && Math.abs(dto.travelDate.getTime() - departure.departureDate.getTime()) > DAY_MS) {
      throw new ApiError(400, 'travelDate does not match the selected departure');
    }

    const [priceGroups, contracts] = await Promise.all([
      this.repository.findPriceGroups(pkg.id),
      this.repository.findActiveContracts(partnerId, [pkg.id]),
    ]);

    const now = new Date();
    const rate = resolveRate({
      tier: partner.tier,
      pkg,
      priceGroups,
      contracts: contracts.map((c) => c.contract),
      departure,
      travelDate,
      paxCount: dto.paxCount,
      agentMarkup: dto.agentMarkup ? { amount: dto.agentMarkup, mode: dto.agentMarkupMode } : null,
      now,
    });

    const reasons: PolicyIssue[] = [...rate.reasons];
    const warnings: PolicyIssue[] = [...rate.warnings];
    let availability: Awaited<ReturnType<B2BInventoryService['getAvailability']>> | null = null;

    if (departure) {
      availability = await this.inventory.getAvailability(partnerId, departure.id, now);
      if (availability.available === null) {
        warnings.push({ code: 'CAPACITY_NOT_TRACKED', message: 'Seat capacity is not tracked for this departure' });
      } else if (availability.available < dto.paxCount) {
        reasons.push({ code: 'INSUFFICIENT_SEATS', message: `Only ${availability.available} seat(s) available` });
      }
    }
    if (partner.currency !== rate.currency) {
      warnings.push({ code: 'CURRENCY_NOTE', message: `Prices are in ${rate.currency}; your settlement currency is ${partner.currency}` });
    }

    return {
      packageId: pkg.id,
      packageTitle: pkg.title,
      departureId: departure?.id ?? null,
      travelDate,
      ...rate,
      eligible: reasons.length === 0,
      reasons,
      warnings,
      availability,
      // Surfaced so a UI can show how markup was interpreted.
      agentMarkupMode: dto.agentMarkup ? dto.agentMarkupMode : null,
      agentMarkupInput: dto.agentMarkup ?? new Dec(0),
    };
  }
}
