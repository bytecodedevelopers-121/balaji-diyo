import { Prisma, PrismaClient } from '@prisma/client';

export class B2BSettlementRepository {
  constructor(private prisma: PrismaClient) {}

  groupBookings(partnerId: string, from: Date, to: Date) {
    return this.prisma.booking.groupBy({
      by: ['b2bStatus'],
      where: { b2bPartnerId: partnerId, channel: 'B2B', createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      _sum: { totalPrice: true, netPayable: true, commissionAmount: true, agentMarkup: true },
    });
  }

  groupLedger(partnerId: string, from: Date, to: Date) {
    return this.prisma.b2BLedgerEntry.groupBy({
      by: ['entryType', 'account', 'direction'],
      where: { partnerId, createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      _sum: { amount: true },
    });
  }

  /** Last entry strictly before `before` (opening position) or at/before `atOrBefore` (closing position). */
  lastEntry(partnerId: string, bound: { before: Date } | { atOrBefore: Date }) {
    return this.prisma.b2BLedgerEntry.findFirst({
      where: { partnerId, createdAt: 'before' in bound ? { lt: bound.before } : { lte: bound.atOrBefore } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { balanceAfter: true, creditUsedAfter: true },
    });
  }

  cancelledBookings(partnerId: string, from: Date, to: Date) {
    return this.prisma.booking.findMany({
      where: { b2bPartnerId: partnerId, channel: 'B2B', b2bStatus: 'CANCELLED', createdAt: { gte: from, lte: to } },
      select: { id: true, commissionAmount: true },
    });
  }

  async ledgerForBookings(bookingIds: string[]) {
    if (bookingIds.length === 0) return [];
    const amendments = await this.prisma.b2BBookingAmendment.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true, bookingId: true } });
    const rows = await this.prisma.b2BLedgerEntry.findMany({
      where: { OR: [{ referenceType: 'BOOKING', referenceId: { in: bookingIds } }, { referenceType: 'AMENDMENT', referenceId: { in: amendments.map((a) => a.id) } }] },
      select: { referenceType: true, referenceId: true, direction: true, amount: true },
    });
    const owner = new Map(amendments.map((a) => [a.id, a.bookingId]));
    return rows.map((r) => ({ bookingId: r.referenceType === 'BOOKING' ? (r.referenceId as string) : (owner.get(r.referenceId as string) as string), direction: r.direction, amount: r.amount }));
  }

  ledgerRows(partnerId: string, from: Date, to: Date, limit: number) {
    return this.prisma.b2BLedgerEntry.findMany({
      where: { partnerId, createdAt: { gte: from, lte: to } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });
  }

  async overview(from: Date, to: Date, skip: number, take: number) {
    const where: Prisma.B2BPartnerWhereInput = { deletedAt: null, status: { in: ['ACTIVE', 'SUSPENDED'] } };
    const [partners, total] = await Promise.all([
      this.prisma.b2BPartner.findMany({
        where, orderBy: { legalName: 'asc' }, skip, take,
        select: { id: true, partnerCode: true, legalName: true, status: true, currency: true, walletBalance: true, creditLimit: true, creditUsed: true },
      }),
      this.prisma.b2BPartner.count({ where }),
    ]);
    const grouped = partners.length === 0 ? [] : await this.prisma.b2BLedgerEntry.groupBy({
      by: ['partnerId', 'entryType', 'account', 'direction'],
      where: { partnerId: { in: partners.map((p) => p.id) }, createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
    });
    return { partners, total, grouped };
  }
}
