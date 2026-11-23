import { Prisma, PrismaClient } from '@prisma/client';

const allotmentSelect = { id: true, partnerId: true, allocatedSeats: true, bookedSeats: true, heldSeats: true, releaseBeforeHours: true, isActive: true } as const;
const departureSelect = {
  id: true, packageId: true, departureDate: true, departureCost: true, departureStatus: true, cutoffHours: true,
  totalSeats: true, bookedSeats: true, heldSeats: true, allotments: { select: allotmentSelect },
} as const satisfies Prisma.DepartureSelect;

const summarySelect = { id: true, title: true, abstract: true, duration: true, durationType: true, groupSize: true, price: true, discount: true, isFeatured: true } as const;

export class B2BCatalogRepository {
  constructor(private prisma: PrismaClient) {}

  async findPackagesPage(q: string | undefined, skip: number, take: number, now: Date) {
    const where: Prisma.PackageWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        select: {
          ...summarySelect,
          priceGroups: { select: { minPeople: true, maxPeople: true, unitPrice: true, offerUnitPrice: true, isDefault: true } },
          departures: { where: { departureDate: { gt: now } }, orderBy: { departureDate: 'asc' }, take: 1, select: departureSelect },
          _count: { select: { departures: { where: { departureDate: { gt: now } } } } },
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.package.count({ where }),
    ]);
    return { items, total };
  }

  findPackageDetail(id: string) {
    return this.prisma.package.findFirst({
      where: { id, isActive: true, deletedAt: null },
      select: {
        ...summarySelect,
        details: true, highlights: true, costIncludesText: true, costExcludesText: true,
        priceGroups: { select: { packageTier: true, minPeople: true, maxPeople: true, unitPrice: true, offerUnitPrice: true, isDefault: true }, orderBy: { minPeople: 'asc' } },
      },
    });
  }

  findUpcomingDepartures(packageId: string, now: Date) {
    return this.prisma.departure.findMany({
      where: { packageId, departureDate: { gt: now } },
      orderBy: { departureDate: 'asc' },
      take: 60,
      select: departureSelect,
    });
  }
}
