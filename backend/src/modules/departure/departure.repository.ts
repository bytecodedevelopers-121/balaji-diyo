import { Prisma, PrismaClient } from '@prisma/client';

// Additive only — existing admin consumers (e.g. frontend-admin's
// DeparturesTab) get this extra nested field alongside everything they
// already got, nothing removed or renamed.
const departureInclude = {
  package: { select: { title: true, duration: true, durationType: true } },
} satisfies Prisma.DepartureInclude;

export class DepartureRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.DepartureUncheckedCreateInput) {
    return this.prisma.departure.create({ data, include: departureInclude });
  }

  createMany(data: Prisma.DepartureCreateManyInput[]) {
    return this.prisma.departure.createMany({ data });
  }

  findById(id: string) {
    return this.prisma.departure.findUnique({ where: { id }, include: departureInclude });
  }

  findMany(where: Prisma.DepartureWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.departure.findMany({
      where,
      include: departureInclude,
      orderBy: { departureDate: 'asc' },
      ...options,
    });
  }

  count(where: Prisma.DepartureWhereInput) {
    return this.prisma.departure.count({ where });
  }

  update(id: string, data: Prisma.DepartureUpdateInput) {
    return this.prisma.departure.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.departure.delete({ where: { id } });
  }

  async hasLastMinute(packageId: string, excludeId?: string) {
    const found = await this.prisma.departure.findFirst({
      where: { packageId, isLastMinute: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return found !== null;
  }

  packageExists(packageId: string) {
    return this.prisma.package.findUnique({ where: { id: packageId }, select: { id: true } });
  }

  findPackageSlug(packageId: string) {
    // A package's slug lives in `url_infos`, not on the package row itself.
    return this.prisma.urlInfo
      .findUnique({ where: { ownerType_ownerId: { ownerType: 'package', ownerId: packageId } } })
      .then((urlInfo) => urlInfo?.urlSlug ?? null);
  }
}
