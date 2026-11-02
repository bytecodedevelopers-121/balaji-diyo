import { Prisma, PrismaClient } from '@prisma/client';

const customBookingInclude = {
  package: { select: { id: true, title: true } },
  travellers: true,
} satisfies Prisma.CustomBookingInclude;

export class CustomBookingRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.CustomBookingUncheckedCreateInput) {
    return this.prisma.customBooking.create({ data, include: customBookingInclude });
  }

  findById(id: string) {
    return this.prisma.customBooking.findUnique({ where: { id }, include: customBookingInclude });
  }

  findMany(where: Prisma.CustomBookingWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.customBooking.findMany({
      where,
      include: customBookingInclude,
      orderBy: { createdAt: 'desc' },
      ...options,
    });
  }

  count(where: Prisma.CustomBookingWhereInput) {
    return this.prisma.customBooking.count({ where });
  }

  packageExists(packageId: string) {
    return this.prisma.package.findUnique({ where: { id: packageId }, select: { id: true } });
  }
}
