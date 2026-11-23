import { Prisma, PrismaClient, SlaTicketStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { InventoryTx } from '../b2b-inventory/b2b-inventory.repository';
import { toContractData } from '../b2b-common/b2b-inputs';
import { Dec } from '../b2b-common/b2b-money';
import type { LockedPartner } from '../b2b-ledger/ledger.types';

interface RawPartnerRow {
  id: string;
  status: LockedPartner['status'];
  currency: string;
  walletBalance: Prisma.Decimal | string;
  creditLimit: Prisma.Decimal | string;
  creditUsed: Prisma.Decimal | string;
  creditAlertSentAt: Date | null;
}

export const bookingInclude = {
  package: { select: { id: true, title: true } },
  travellers: { orderBy: [{ isLead: 'desc' as const }, { createdAt: 'asc' as const }] },
  invoice: true,
  amendments: { orderBy: { createdAt: 'desc' as const } },
} as const satisfies Prisma.BookingInclude;

export const customBookingInclude = {
  package: { select: { id: true, title: true } },
  travellers: true,
  b2bPartner: { select: { id: true, partnerCode: true, legalName: true } },
} as const satisfies Prisma.CustomBookingInclude;

/**
 * Everything a financial/booking transaction touches, on one transaction client.
 *
 * LOCK ORDER (all writers): departure(s) by id → their allotments → partner row → booking row.
 * Wallet top-ups and manual adjustments only ever take the partner lock, so no cycle exists.
 */
export class FinanceTx extends InventoryTx {
  // ── partner / ledger ────────────────────────────────────────────────────
  async lockPartner(partnerId: string): Promise<LockedPartner | null> {
    const rows = await this.tx.$queryRaw<RawPartnerRow[]>`
      SELECT id, status, currency, "walletBalance", "creditLimit", "creditUsed", "creditAlertSentAt"
      FROM b2b_partners WHERE id = ${partnerId} AND "deletedAt" IS NULL FOR UPDATE`;
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id, status: r.status, currency: r.currency, creditAlertSentAt: r.creditAlertSentAt,
      walletBalance: new Dec(r.walletBalance.toString()),
      creditLimit: new Dec(r.creditLimit.toString()),
      creditUsed: new Dec(r.creditUsed.toString()),
    };
  }

  async applyBalances(partnerId: string, b: { walletBalance: Prisma.Decimal; creditUsed: Prisma.Decimal; creditAlertSentAt: Date | null; creditLimit?: Prisma.Decimal }): Promise<void> {
    await this.tx.b2BPartner.update({ where: { id: partnerId }, data: b, select: { id: true } });
  }

  insertLedgerEntry(data: Prisma.B2BLedgerEntryUncheckedCreateInput) {
    return this.tx.b2BLedgerEntry.create({ data, select: { id: true } });
  }

  findLedgerEntry(entryType: Prisma.B2BLedgerEntryWhereInput['entryType'], account: Prisma.B2BLedgerEntryWhereInput['account'], referenceType: string, referenceId: string) {
    return this.tx.b2BLedgerEntry.findFirst({ where: { entryType, account, referenceType, referenceId }, select: { id: true } });
  }

  /** All ledger movements that belong to a booking: its own entries plus those of its amendments. */
  async findBookingLedger(bookingId: string) {
    const amendments = await this.tx.b2BBookingAmendment.findMany({ where: { bookingId }, select: { id: true } });
    return this.tx.b2BLedgerEntry.findMany({
      where: { OR: [{ referenceType: 'BOOKING', referenceId: bookingId }, { referenceType: 'AMENDMENT', referenceId: { in: amendments.map((a) => a.id) } }] },
      orderBy: { createdAt: 'asc' },
    });
  }

  findPayment(id: string) {
    return this.tx.payment.findUnique({ where: { id }, select: { id: true, status: true, b2bPartnerId: true, bookingId: true, totalAmount: true, currency: true, deletedAt: true } });
  }

  // ── pricing context ─────────────────────────────────────────────────────
  async findPricingInputs(partnerId: string, packageId: string) {
    const [partner, pkg, priceGroups, contracts] = await Promise.all([
      this.tx.b2BPartner.findFirst({ where: { id: partnerId, deletedAt: null }, select: { tier: { select: { defaultRateType: true, defaultCommissionPct: true, holdDurationMinutes: true, slaResponseHours: true } } } }),
      this.tx.package.findFirst({ where: { id: packageId, isActive: true, deletedAt: null }, select: { id: true, title: true, price: true, discount: true, duration: true, durationType: true } }),
      this.tx.priceGroup.findMany({ where: { packageId }, select: { minPeople: true, maxPeople: true, unitPrice: true, offerUnitPrice: true, isDefault: true } }),
      this.tx.b2BPartnerContract.findMany({ where: { partnerId, packageId, isActive: true } }),
    ]);
    return { tier: partner?.tier ?? null, pkg, priceGroups, contracts: contracts.map(toContractData) };
  }

  findDepartureFull(id: string) {
    return this.tx.departure.findUnique({ where: { id }, select: { id: true, packageId: true, departureCost: true } });
  }

  // ── holds ───────────────────────────────────────────────────────────────
  /** ACTIVE → CONVERTED, compare-and-set. */
  async convertHold(id: string, bookingId: string): Promise<boolean> {
    const { count } = await this.tx.b2BInventoryHold.updateMany({ where: { id, status: 'ACTIVE' }, data: { status: 'CONVERTED', convertedBookingId: bookingId } });
    return count === 1;
  }

  createConvertedHold(data: { partnerId: string; departureId: string; seatsHeld: number; allotmentId: string | null; expiresAt: Date; bookingId: string }) {
    return this.tx.b2BInventoryHold.create({
      data: { partnerId: data.partnerId, departureId: data.departureId, seatsHeld: data.seatsHeld, allotmentId: data.allotmentId, expiresAt: data.expiresAt, status: 'CONVERTED', convertedBookingId: data.bookingId },
      select: { id: true },
    });
  }

  createActiveHold(data: { partnerId: string; departureId: string; seatsHeld: number; allotmentId: string | null; expiresAt: Date }) {
    return this.tx.b2BInventoryHold.create({ data: { ...data, status: 'ACTIVE' }, select: { id: true } });
  }

  /** Seats a booking still occupies: CONVERTED holds not yet returned to inventory. */
  findLiveBookingHolds(bookingId: string) {
    return this.tx.b2BInventoryHold.findMany({
      where: { convertedBookingId: bookingId, status: 'CONVERTED', releasedAt: null },
      select: { id: true, departureId: true, seatsHeld: true, allotmentId: true },
    });
  }

  async markHoldSeatsReturned(id: string, now: Date): Promise<void> {
    await this.tx.b2BInventoryHold.update({ where: { id }, data: { releasedAt: now }, select: { id: true } });
  }

  findActiveHoldForBooking(bookingId: string) {
    return this.tx.b2BInventoryHold.findFirst({ where: { convertedBookingId: bookingId, status: 'ACTIVE' } });
  }

  linkHoldToBooking(id: string, bookingId: string) {
    return this.tx.b2BInventoryHold.update({ where: { id }, data: { convertedBookingId: bookingId }, select: { id: true } });
  }

  findHoldById(id: string) {
    return this.tx.b2BInventoryHold.findUnique({ where: { id } });
  }

  // ── bookings ────────────────────────────────────────────────────────────
  async lockBooking(id: string): Promise<void> {
    await this.tx.$queryRaw`SELECT id FROM bookings WHERE id = ${id} FOR UPDATE`;
  }

  createBooking(data: Prisma.BookingUncheckedCreateInput) {
    return this.tx.booking.create({ data, include: bookingInclude });
  }

  findBooking(id: string) {
    return this.tx.booking.findUnique({ where: { id }, include: bookingInclude });
  }

  updateBooking(id: string, data: Prisma.BookingUncheckedUpdateInput) {
    return this.tx.booking.update({ where: { id }, data, include: bookingInclude });
  }

  async replaceTravellers(bookingId: string, travellers: Omit<Prisma.TravellerCreateManyInput, 'bookingId'>[]): Promise<void> {
    await this.tx.traveller.deleteMany({ where: { bookingId } });
    await this.tx.traveller.createMany({ data: travellers.map((t) => ({ ...t, bookingId })) });
  }

  upsertInvoice(bookingId: string, data: { invoiceAmount: Prisma.Decimal; invoicePayType: string; invoiceStatus: number; invoiceNote: string | null; transactionCode: string }) {
    return this.tx.invoice.upsert({ where: { bookingId }, create: { bookingId, ...data }, update: data });
  }

  // ── custom bookings ─────────────────────────────────────────────────────
  createCustomBooking(data: Prisma.CustomBookingUncheckedCreateInput) {
    return this.tx.customBooking.create({ data, include: customBookingInclude });
  }

  findCustomBooking(id: string) {
    return this.tx.customBooking.findUnique({ where: { id }, include: customBookingInclude });
  }

  updateCustomBooking(id: string, data: Prisma.CustomBookingUncheckedUpdateInput) {
    return this.tx.customBooking.update({ where: { id }, data, include: customBookingInclude });
  }

  async lockCustomBooking(id: string): Promise<void> {
    await this.tx.$queryRaw`SELECT id FROM custom_bookings WHERE id = ${id} FOR UPDATE`;
  }

  // ── amendments ──────────────────────────────────────────────────────────
  createAmendment(data: Prisma.B2BBookingAmendmentUncheckedCreateInput) {
    return this.tx.b2BBookingAmendment.create({ data });
  }

  findPendingAmendment(bookingId: string) {
    return this.tx.b2BBookingAmendment.findFirst({ where: { bookingId, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
  }

  resolveAmendment(id: string, data: Prisma.B2BBookingAmendmentUncheckedUpdateInput) {
    return this.tx.b2BBookingAmendment.update({ where: { id }, data });
  }

  // ── webhook outbox (written in the SAME transaction as the change it announces) ─────────────
  /** One PENDING delivery per active endpoint subscribed to `type`; the dispatcher sends them after commit. */
  async enqueueWebhookEvent(partnerId: string, type: string, data: Prisma.InputJsonObject): Promise<number> {
    const endpoints = await this.tx.b2BWebhookEndpoint.findMany({
      where: { partnerId, isActive: true, events: { array_contains: type } },
      select: { id: true },
    });
    if (endpoints.length === 0) return 0;
    const createdAt = new Date().toISOString();
    await this.tx.b2BWebhookDelivery.createMany({
      data: endpoints.map((e) => {
        const id = randomUUID();
        return { id, endpointId: e.id, partnerId, eventType: type, payload: { id, type, createdAt, data } };
      }),
    });
    return endpoints.length;
  }

  // ── SLA tickets ─────────────────────────────────────────────────────────
  createSlaTicket(data: { partnerId: string; bookingId?: string; customBookingId?: string; subject: string; priority?: string; dueAt: Date }) {
    return this.tx.b2BSlaTicket.create({ data: { ...data, status: 'OPEN' }, select: { id: true } });
  }

  /** Marks every unresolved ticket for a booking/custom booking RESOLVED; returns what they were, for the audit trail. */
  async resolveSlaTicketsFor(ref: { bookingId?: string; customBookingId?: string }, now: Date) {
    const open = await this.tx.b2BSlaTicket.findMany({
      where: { ...(ref.bookingId ? { bookingId: ref.bookingId } : { customBookingId: ref.customBookingId }), status: { not: 'RESOLVED' } },
      select: { id: true, status: true, partnerId: true },
    });
    if (open.length > 0) {
      await this.tx.b2BSlaTicket.updateMany({ where: { id: { in: open.map((t) => t.id) }, status: { not: 'RESOLVED' } }, data: { status: 'RESOLVED', resolvedAt: now } });
    }
    return open;
  }

  findSlaTicket(id: string) {
    return this.tx.b2BSlaTicket.findUnique({ where: { id } });
  }

  /** Compare-and-set so concurrent sweeps/admin edits can't double-transition a ticket. */
  async transitionSlaTicket(id: string, from: SlaTicketStatus, data: Prisma.B2BSlaTicketUncheckedUpdateManyInput): Promise<boolean> {
    const { count } = await this.tx.b2BSlaTicket.updateMany({ where: { id, status: from }, data });
    return count === 1;
  }

  /** Active, non-deleted users who should hear about finance events for this partner. */
  async findFinanceRecipients(partnerId: string): Promise<string[]> {
    const users = await this.tx.user.findMany({
      where: { b2bPartnerId: partnerId, isActive: true, deletedAt: null, b2bRole: { in: ['AGENCY_ADMIN', 'FINANCE_MANAGER'] } },
      select: { email: true },
    });
    return users.map((u) => u.email);
  }
}

export class B2BFinanceRepository {
  constructor(private prisma: PrismaClient) {}

  withTransaction<T>(fn: (tx: FinanceTx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((client) => fn(new FinanceTx(client)));
  }

  writeAudit(entry: Prisma.ActivityLogUncheckedCreateInput) {
    return this.prisma.activityLog.create({ data: entry, select: { id: true } });
  }

  // ── reads ───────────────────────────────────────────────────────────────
  findPartnerFinance(partnerId: string) {
    return this.prisma.b2BPartner.findFirst({
      where: { id: partnerId, deletedAt: null },
      select: { id: true, status: true, currency: true, walletBalance: true, creditLimit: true, creditUsed: true, creditAlertSentAt: true },
    });
  }

  findFinanceRecipients(partnerId: string): Promise<string[]> {
    return this.prisma.user
      .findMany({ where: { b2bPartnerId: partnerId, isActive: true, deletedAt: null, b2bRole: { in: ['AGENCY_ADMIN', 'FINANCE_MANAGER'] } }, select: { email: true } })
      .then((u) => u.map((x) => x.email));
  }

  findHoldForPartner(partnerId: string, id: string) {
    return this.prisma.b2BInventoryHold.findFirst({ where: { id, partnerId } });
  }

  // ── SLA reads / sweep candidates ──────────────────────────────────────
  findSlaSweepCandidates(now: Date, limit: number) {
    return this.prisma.b2BSlaTicket.findMany({
      where: { dueAt: { lte: now }, status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } },
      orderBy: { dueAt: 'asc' },
      take: limit,
    });
  }

  async listSlaTickets(where: Prisma.B2BSlaTicketWhereInput, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.b2BSlaTicket.findMany({
        where, orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }], skip, take,
        include: { partner: { select: { id: true, partnerCode: true, legalName: true } } },
      }),
      this.prisma.b2BSlaTicket.count({ where }),
    ]);
    return { items, total };
  }

  async findBookingRefs(bookingIds: string[], customIds: string[]) {
    const [bookings, customs] = await Promise.all([
      bookingIds.length ? this.prisma.booking.findMany({ where: { id: { in: bookingIds } }, select: { id: true, bookingNumber: true } }) : [],
      customIds.length ? this.prisma.customBooking.findMany({ where: { id: { in: customIds } }, select: { id: true } }) : [],
    ]);
    return { bookings: new Map(bookings.map((b) => [b.id, `BA-${b.bookingNumber}`])), customs: new Set(customs.map((c) => c.id)) };
  }

  findPartnerContact(partnerId: string) {
    return this.prisma.b2BPartner.findFirst({ where: { id: partnerId, deletedAt: null }, select: { id: true, legalName: true, currency: true, status: true } });
  }

  async listLedger(partnerId: string, where: Prisma.B2BLedgerEntryWhereInput, skip: number, take: number) {
    const filter: Prisma.B2BLedgerEntryWhereInput = { partnerId, ...where };
    const [items, total] = await Promise.all([
      this.prisma.b2BLedgerEntry.findMany({ where: filter, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take }),
      this.prisma.b2BLedgerEntry.count({ where: filter }),
    ]);
    return { items, total };
  }

  async listPartnerBookings(partnerId: string, where: Prisma.BookingWhereInput, skip: number, take: number) {
    const filter: Prisma.BookingWhereInput = { b2bPartnerId: partnerId, channel: 'B2B', ...where };
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({ where: filter, include: bookingInclude, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.booking.count({ where: filter }),
    ]);
    return { items, total };
  }

  async listPartnerCustomBookings(partnerId: string, where: Prisma.CustomBookingWhereInput, skip: number, take: number) {
    const filter: Prisma.CustomBookingWhereInput = { b2bPartnerId: partnerId, channel: 'B2B', ...where };
    const [items, total] = await Promise.all([
      this.prisma.customBooking.findMany({ where: filter, include: customBookingInclude, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.customBooking.count({ where: filter }),
    ]);
    return { items, total };
  }

  findBooking(id: string) {
    return this.prisma.booking.findUnique({ where: { id }, include: { ...bookingInclude, b2bPartner: { select: { id: true, partnerCode: true, legalName: true } } } });
  }

  findCustomBooking(id: string) {
    return this.prisma.customBooking.findUnique({ where: { id }, include: customBookingInclude });
  }

  async listAdminBookings(where: Prisma.BookingWhereInput, skip: number, take: number) {
    const filter: Prisma.BookingWhereInput = { channel: 'B2B', ...where };
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({ where: filter, include: { ...bookingInclude, b2bPartner: { select: { id: true, partnerCode: true, legalName: true } } }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.booking.count({ where: filter }),
    ]);
    return { items, total };
  }

  async listAdminCustomBookings(where: Prisma.CustomBookingWhereInput, skip: number, take: number) {
    const filter: Prisma.CustomBookingWhereInput = { channel: 'B2B', ...where };
    const [items, total] = await Promise.all([
      this.prisma.customBooking.findMany({ where: filter, include: customBookingInclude, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.customBooking.count({ where: filter }),
    ]);
    return { items, total };
  }

  async findBookingLedgerRead(bookingId: string) {
    const amendments = await this.prisma.b2BBookingAmendment.findMany({ where: { bookingId }, select: { id: true } });
    return this.prisma.b2BLedgerEntry.findMany({
      where: { OR: [{ referenceType: 'BOOKING', referenceId: bookingId }, { referenceType: 'AMENDMENT', referenceId: { in: amendments.map((a) => a.id) } }] },
      orderBy: { createdAt: 'asc' },
    });
  }
}
