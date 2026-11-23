import { PrismaClient } from '@prisma/client';
import { toContractData } from '../b2b-common/b2b-inputs';

export class B2BPricingRepository {
  constructor(private prisma: PrismaClient) {}

  findPartnerWithTier(partnerId: string) {
    return this.prisma.b2BPartner.findFirst({
      where: { id: partnerId, deletedAt: null },
      select: { id: true, status: true, currency: true, tier: { select: { defaultRateType: true, defaultCommissionPct: true, holdDurationMinutes: true } } },
    });
  }

  findPackage(id: string) {
    return this.prisma.package.findFirst({
      where: { id, isActive: true, deletedAt: null },
      select: { id: true, title: true, price: true, discount: true },
    });
  }

  findDeparture(id: string) {
    return this.prisma.departure.findUnique({
      where: { id },
      select: { id: true, packageId: true, departureDate: true, departureCost: true, departureStatus: true, cutoffHours: true, totalSeats: true, bookedSeats: true, heldSeats: true },
    });
  }

  findPriceGroups(packageId: string) {
    return this.prisma.priceGroup.findMany({
      where: { packageId },
      select: { minPeople: true, maxPeople: true, unitPrice: true, offerUnitPrice: true, isDefault: true },
    });
  }

  async findActiveContracts(partnerId: string, packageIds: string[]) {
    const rows = await this.prisma.b2BPartnerContract.findMany({
      where: { partnerId, packageId: { in: packageIds }, isActive: true },
    });
    return rows.map((r) => ({ packageId: r.packageId, contract: toContractData(r) }));
  }
}
