import { Prisma, PrismaClient } from '@prisma/client';
import { toContractData } from '../b2b-common/b2b-inputs';
import type { AllotmentSeats } from './availability';

export interface LockedDeparture {
  id: string;
  packageId: string;
  departureDate: Date;
  departureStatus: string;
  totalSeats: number | null;
  bookedSeats: number;
  heldSeats: number;
  cutoffHours: number;
}

export const holdInclude = {
  departure: { select: { id: true, departureDate: true, package: { select: { id: true, title: true } } } },
} as const satisfies Prisma.B2BInventoryHoldInclude;

export const allotmentInclude = {
  partner: { select: { id: true, partnerCode: true, legalName: true } },
  departure: { select: { id: true, departureDate: true, totalSeats: true, bookedSeats: true, heldSeats: true, package: { select: { id: true, title: true } } } },
} as const satisfies Prisma.B2BInventoryAllotmentInclude;

/**
 * Query surface available inside an inventory transaction. Business rules stay
 * in the service; this class only runs statements on the transaction's client.
 *
 * LOCK ORDER (every writer, no exceptions): departure row → its allotment rows
 * (ordered by id) → hold rows. A single global order means concurrent writers
 * serialize instead of deadlocking.
 */
export class InventoryTx {
  constructor(protected tx: Prisma.TransactionClient) {}

  async lockDeparture(id: string): Promise<LockedDeparture | null> {
    const rows = await this.tx.$queryRaw<LockedDeparture[]>`
      SELECT id, "packageId", "departureDate", "departureStatus", "totalSeats", "bookedSeats", "heldSeats", "cutoffHours"
      FROM package_departures WHERE id = ${id} FOR UPDATE`;
    return rows[0] ?? null;
  }

  lockAllotments(departureId: string): Promise<AllotmentSeats[]> {
    return this.tx.$queryRaw<AllotmentSeats[]>`
      SELECT id, "partnerId", "allocatedSeats", "bookedSeats", "heldSeats", "releaseBeforeHours", "isActive"
      FROM b2b_inventory_allotments WHERE "departureId" = ${departureId} ORDER BY id FOR UPDATE`;
  }

  findPartnerTier(partnerId: string) {
    return this.tx.b2BPartner.findFirst({
      where: { id: partnerId, deletedAt: null },
      select: { status: true, tier: { select: { holdDurationMinutes: true } } },
    });
  }

  async findActiveContracts(partnerId: string, packageId: string) {
    const rows = await this.tx.b2BPartnerContract.findMany({ where: { partnerId, packageId, isActive: true } });
    return rows.map(toContractData);
  }

  countActiveHolds(partnerId: string) {
    return this.tx.b2BInventoryHold.count({ where: { partnerId, status: 'ACTIVE' } });
  }

  createHold(data: Prisma.B2BInventoryHoldUncheckedCreateInput) {
    return this.tx.b2BInventoryHold.create({ data, select: { id: true } });
  }

  findHold(id: string, partnerId: string) {
    return this.tx.b2BInventoryHold.findFirst({ where: { id, partnerId } });
  }

  findDueHolds(departureId: string, now: Date) {
    return this.tx.b2BInventoryHold.findMany({
      where: { departureId, status: 'ACTIVE', expiresAt: { lte: now } },
      select: { id: true, partnerId: true, seatsHeld: true, allotmentId: true },
    });
  }

  /** Compare-and-set status; false means someone else already moved it. */
  async transitionHold(id: string, to: 'RELEASED' | 'EXPIRED', now: Date): Promise<boolean> {
    const { count } = await this.tx.b2BInventoryHold.updateMany({
      where: { id, status: 'ACTIVE' },
      data: { status: to, releasedAt: now },
    });
    return count === 1;
  }

  /** delta may be negative; counters are clamped at 0 (the DB CHECKs reject anything impossible on the way up). */
  async adjustHeld(departureId: string, allotmentId: string | null, delta: number): Promise<void> {
    await this.tx.$executeRaw`
      UPDATE package_departures SET "heldSeats" = GREATEST("heldSeats" + ${delta}::int, 0), "updatedAt" = now() WHERE id = ${departureId}`;
    if (allotmentId) {
      await this.tx.$executeRaw`
        UPDATE b2b_inventory_allotments SET "heldSeats" = GREATEST("heldSeats" + ${delta}::int, 0), "updatedAt" = now() WHERE id = ${allotmentId}`;
    }
  }

  /** Moves held/booked counters by signed deltas on the departure and (if any) its allotment; clamped at 0. */
  async adjustSeatCounters(departureId: string, allotmentId: string | null, heldDelta: number, bookedDelta: number): Promise<void> {
    await this.tx.$executeRaw`
      UPDATE package_departures SET "heldSeats" = GREATEST("heldSeats" + ${heldDelta}::int, 0), "bookedSeats" = GREATEST("bookedSeats" + ${bookedDelta}::int, 0), "updatedAt" = now() WHERE id = ${departureId}`;
    if (allotmentId) {
      await this.tx.$executeRaw`
        UPDATE b2b_inventory_allotments SET "heldSeats" = GREATEST("heldSeats" + ${heldDelta}::int, 0), "bookedSeats" = GREATEST("bookedSeats" + ${bookedDelta}::int, 0), "updatedAt" = now() WHERE id = ${allotmentId}`;
    }
  }

  findPartnerStatus(partnerId: string) {
    return this.tx.b2BPartner.findFirst({ where: { id: partnerId, deletedAt: null }, select: { status: true } });
  }

  upsertAllotment(partnerId: string, departureId: string, data: { allocatedSeats: number; releaseBeforeHours: number; isActive: boolean }) {
    return this.tx.b2BInventoryAllotment.upsert({
      where: { partnerId_departureId: { partnerId, departureId } },
      create: { partnerId, departureId, ...data },
      update: data,
      include: allotmentInclude,
    });
  }

  setDepartureCapacity(departureId: string, data: { totalSeats: number | null; cutoffHours: number }) {
    return this.tx.departure.update({
      where: { id: departureId }, data,
      select: { id: true, packageId: true, departureDate: true, totalSeats: true, bookedSeats: true, heldSeats: true, cutoffHours: true },
    });
  }

  audit(entry: Prisma.ActivityLogUncheckedCreateInput) {
    return this.tx.activityLog.create({ data: entry, select: { id: true } });
  }
}

export class B2BInventoryRepository {
  constructor(private prisma: PrismaClient) {}

  withTransaction<T>(fn: (tx: InventoryTx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((client) => fn(new InventoryTx(client)));
  }

  /** Non-locking snapshot for read paths (quotes, catalog, availability display). */
  findDepartureSnapshot(departureId: string) {
    return this.prisma.departure.findUnique({
      where: { id: departureId },
      select: {
        id: true, departureDate: true, totalSeats: true, bookedSeats: true, heldSeats: true,
        allotments: { select: { id: true, partnerId: true, allocatedSeats: true, bookedSeats: true, heldSeats: true, releaseBeforeHours: true, isActive: true } },
      },
    });
  }

  async findDueDepartureIds(now: Date, limit: number): Promise<string[]> {
    const rows = await this.prisma.b2BInventoryHold.findMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      distinct: ['departureId'],
      select: { departureId: true },
      take: limit,
    });
    return rows.map((r) => r.departureId);
  }

  async listHolds(partnerId: string, where: { status?: string }, skip: number, take: number) {
    const filter: Prisma.B2BInventoryHoldWhereInput = { partnerId, ...(where.status ? { status: where.status } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.b2BInventoryHold.findMany({ where: filter, include: holdInclude, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.b2BInventoryHold.count({ where: filter }),
    ]);
    return { items, total };
  }

  findHold(partnerId: string, id: string) {
    return this.prisma.b2BInventoryHold.findFirst({ where: { id, partnerId }, include: holdInclude });
  }

  async listAllotments(where: Prisma.B2BInventoryAllotmentWhereInput, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.b2BInventoryAllotment.findMany({ where, include: allotmentInclude, orderBy: [{ departure: { departureDate: 'asc' } }, { createdAt: 'desc' }], skip, take }),
      this.prisma.b2BInventoryAllotment.count({ where }),
    ]);
    return { items, total };
  }
}
