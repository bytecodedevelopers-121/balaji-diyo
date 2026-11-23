import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { B2BInventoryRepository, InventoryTx, holdInclude } from './b2b-inventory.repository';
import { computeAvailability, type Availability } from './availability';
import { evaluatePolicy, findApplicableContract } from '../b2b-pricing/pricing.engine';
import { Dec } from '../b2b-common/b2b-money';
import type { CreateHoldDtoType, ListHoldsQueryDtoType } from './dto';
import type { Prisma } from '@prisma/client';

const MAX_ACTIVE_HOLDS_PER_PARTNER = 20; // stops one agency from parking inventory
const SWEEP_BATCH = 100;

type HoldView = Prisma.B2BInventoryHoldGetPayload<{ include: typeof holdInclude }>;

/** An ACTIVE hold past its expiry is reported EXPIRED immediately, even before the sweeper has persisted it. */
const withEffectiveStatus = (h: HoldView, now: Date) => ({
  ...h,
  effectiveStatus: h.status === 'ACTIVE' && h.expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : h.status,
});

export class B2BInventoryService {
  constructor(private repository: B2BInventoryRepository) {}

  async getAvailability(partnerId: string, departureId: string, now = new Date()): Promise<Availability> {
    const dep = await this.repository.findDepartureSnapshot(departureId);
    if (!dep) throw new ApiError(404, 'Departure not found');
    return computeAvailability(dep, dep.allotments, partnerId, now);
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async createHold(partnerId: string, actorId: string, dto: CreateHoldDtoType) {
    const now = new Date();
    const holdId = await this.repository.withTransaction(async (tx) => {
      // 1. Serialize on the departure (then its allotments) before reading anything that decides the outcome.
      let locked = await this.lockAll(tx, dto.departureId);

      // 2. Free seats from holds that lapsed but haven't been swept yet, so they never block a live request.
      if ((await this.expireDue(tx, locked.dep.id, now)) > 0) locked = await this.lockAll(tx, dto.departureId); // reload counters
      const { dep: fresh, allotments: allotmentsFresh } = locked;

      const partner = await tx.findPartnerTier(partnerId);
      if (!partner) throw new ApiError(404, 'Partner not found');
      if (partner.status !== 'ACTIVE') throw new ApiError(403, 'Partner account is not active');

      // 3. Policy: bookable, cut-off, contract blackout / pax bounds.
      const contracts = await tx.findActiveContracts(partnerId, fresh.packageId);
      const contract = findApplicableContract(contracts, fresh.departureDate);
      const policy = evaluatePolicy({
        contract,
        departure: { departureDate: fresh.departureDate, departureCost: new Dec(0), cutoffHours: fresh.cutoffHours, departureStatus: fresh.departureStatus },
        travelDate: fresh.departureDate,
        paxCount: dto.seatsHeld,
        now,
      });
      const blocker = policy.reasons[0];
      if (blocker) {
        const conflict = blocker.code === 'DEPARTURE_NOT_BOOKABLE' || blocker.code === 'CUTOFF_PASSED';
        throw new ApiError(conflict ? 409 : 422, blocker.message);
      }

      // 4. Capacity.
      const availability = computeAvailability(fresh, allotmentsFresh, partnerId, now);
      if (availability.available !== null && availability.available < dto.seatsHeld) {
        throw new ApiError(409, `Only ${availability.available} seat(s) available on this departure`);
      }
      if ((await tx.countActiveHolds(partnerId)) >= MAX_ACTIVE_HOLDS_PER_PARTNER) {
        throw new ApiError(409, `You can have at most ${MAX_ACTIVE_HOLDS_PER_PARTNER} active holds; release one first`);
      }

      // 5. Expiry = tier hold window, never later than the booking cut-off.
      const holdEnds = now.getTime() + partner.tier.holdDurationMinutes * 60_000;
      const expiresAt = new Date(policy.cutoffAt ? Math.min(holdEnds, policy.cutoffAt.getTime()) : holdEnds);
      if (expiresAt.getTime() <= now.getTime()) throw new ApiError(409, 'Booking cut-off has passed');

      // 6. Write.
      await tx.adjustHeld(fresh.id, availability.allotmentId, dto.seatsHeld);
      const hold = await tx.createHold({
        partnerId, departureId: fresh.id, seatsHeld: dto.seatsHeld, expiresAt, allotmentId: availability.allotmentId, status: 'ACTIVE',
      });
      await tx.audit(buildAuditEntry({
        actorType: 'user', actorId, action: 'hold.created', title: 'Inventory hold created', category: 'b2b_partner', categoryId: partnerId,
        data: { holdId: hold.id, departureId: fresh.id, seats: dto.seatsHeld, source: availability.source, allotmentId: availability.allotmentId, expiresAt: expiresAt.toISOString() },
      }));
      return hold.id;
    });
    return this.getHold(partnerId, holdId);
  }

  private async lockAll(tx: InventoryTx, departureId: string) {
    const dep = await tx.lockDeparture(departureId);
    if (!dep) throw new ApiError(404, 'Departure not found');
    return { dep, allotments: await tx.lockAllotments(dep.id) };
  }

  // ── Release ───────────────────────────────────────────────────────────────

  async releaseHold(partnerId: string, actorId: string, holdId: string) {
    const existing = await this.repository.findHold(partnerId, holdId); // tenant-scoped: foreign ids are simply 404
    if (!existing) throw new ApiError(404, 'Hold not found');

    await this.repository.withTransaction(async (tx) => {
      await tx.lockDeparture(existing.departureId);
      await tx.lockAllotments(existing.departureId);
      const hold = await tx.findHold(holdId, partnerId);
      if (!hold) throw new ApiError(404, 'Hold not found');
      if (hold.status !== 'ACTIVE') throw new ApiError(409, `Hold is already ${hold.status.toLowerCase()}`);

      if (!(await tx.transitionHold(hold.id, 'RELEASED', new Date()))) throw new ApiError(409, 'Hold is no longer active');
      await tx.adjustHeld(hold.departureId, hold.allotmentId, -hold.seatsHeld);
      await tx.audit(buildAuditEntry({
        actorType: 'user', actorId, action: 'hold.released', title: 'Inventory hold released', category: 'b2b_partner', categoryId: partnerId,
        data: { holdId: hold.id, departureId: hold.departureId, seats: hold.seatsHeld },
      }));
    });
    return this.getHold(partnerId, holdId);
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async getHold(partnerId: string, id: string) {
    const hold = await this.repository.findHold(partnerId, id);
    if (!hold) throw new ApiError(404, 'Hold not found');
    return withEffectiveStatus(hold, new Date());
  }

  async listHolds(partnerId: string, dto: ListHoldsQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const { items, total } = await this.repository.listHolds(partnerId, { status: dto.status }, pagination.skip, pagination.take);
    const now = new Date();
    return PaginationDto.create({ items: items.map((h) => withEffectiveStatus(h, now)), page: pagination.page, perPage: pagination.perPage, total });
  }

  // ── Expiry ────────────────────────────────────────────────────────────────

  /** Caller must already hold the departure + allotment locks. Idempotent: only ACTIVE holds are touched. */
  private async expireDue(tx: InventoryTx, departureId: string, now: Date): Promise<number> {
    const due = await tx.findDueHolds(departureId, now);
    let expired = 0;
    for (const h of due) {
      if (!(await tx.transitionHold(h.id, 'EXPIRED', now))) continue;
      await tx.adjustHeld(departureId, h.allotmentId, -h.seatsHeld);
      await tx.audit(buildAuditEntry({
        actorType: 'system', actorId: 'hold-expiry', action: 'hold.expired', title: 'Inventory hold expired', category: 'b2b_partner', categoryId: h.partnerId,
        data: { holdId: h.id, departureId, seats: h.seatsHeld },
      }));
      expired += 1;
    }
    return expired;
  }

  /** Background sweep. Safe to run from several processes at once: each departure is processed under its own row lock. */
  async sweepExpiredHolds(now = new Date()): Promise<number> {
    const departureIds = await this.repository.findDueDepartureIds(now, SWEEP_BATCH);
    let total = 0;
    for (const id of departureIds) {
      total += await this.repository.withTransaction(async (tx) => {
        if (!(await tx.lockDeparture(id))) return 0;
        await tx.lockAllotments(id);
        return this.expireDue(tx, id, now);
      });
    }
    return total;
  }
}
