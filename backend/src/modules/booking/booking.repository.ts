import { Prisma, PrismaClient } from '@prisma/client';

const bookingInclude = {
  package: { select: { id: true, title: true } },
  travellers: true,
  invoice: true,
  payments: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' as const },
    select: { id: true, gateway: true, status: true, totalAmount: true, percentage: true, createdAt: true },
  },
} satisfies Prisma.BookingInclude;

export class BookingRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.BookingUncheckedCreateInput) {
    return this.prisma.booking.create({ data, include: bookingInclude });
  }

  findById(id: string) {
    return this.prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  }

  findMany(where: Prisma.BookingWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
      ...options,
    });
  }

  count(where: Prisma.BookingWhereInput) {
    return this.prisma.booking.count({ where });
  }

  addTravellers(bookingId: string, travellers: Omit<Prisma.TravellerCreateManyInput, 'bookingId'>[]) {
    return this.prisma.traveller.createMany({
      data: travellers.map((t) => ({ ...t, bookingId })),
    });
  }

  createInvoice(bookingId: string, data: Omit<Prisma.InvoiceUncheckedCreateInput, 'bookingId'>) {
    return this.prisma.invoice.create({ data: { ...data, bookingId } });
  }

  findInvoiceByBookingId(bookingId: string) {
    return this.prisma.invoice.findUnique({ where: { bookingId } });
  }

  // Travellers/invoice both carry a required FK back to the booking (no
  // cascade configured in the schema), so they have to go first inside the
  // same transaction or the booking delete itself would hit P2003.
  /** B2B bookings carry ledger history and seat counters; the legacy admin delete must not remove them. */
  countB2B(ids: string[]) {
    return this.prisma.booking.count({ where: { id: { in: ids }, channel: 'B2B' } });
  }

  delete(id: string) {
    return this.prisma.$transaction([
      this.prisma.traveller.deleteMany({ where: { bookingId: id } }),
      this.prisma.invoice.deleteMany({ where: { bookingId: id } }),
      this.prisma.booking.delete({ where: { id } }),
    ]);
  }

  bulkDelete(ids: string[]) {
    return this.prisma.$transaction([
      this.prisma.traveller.deleteMany({ where: { bookingId: { in: ids } } }),
      this.prisma.invoice.deleteMany({ where: { bookingId: { in: ids } } }),
      this.prisma.booking.deleteMany({ where: { id: { in: ids } } }),
    ]);
  }
}
