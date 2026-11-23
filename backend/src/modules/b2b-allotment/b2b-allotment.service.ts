import { Prisma } from '@prisma/client';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { B2BInventoryRepository, InventoryTx } from '../b2b-inventory/b2b-inventory.repository';
import type { AllotmentSeats } from '../b2b-inventory/availability';
import type { ListAllotmentsQueryDtoType, SetCapacityDtoType, UpsertAllotmentDtoType } from './dto';

/** Seats reserved by active allotments, optionally excluding one partner's. */
const reservedSeats = (allotments: AllotmentSeats[], excludePartnerId?: string): number =>
  allotments.filter((a) => a.isActive && a.partnerId !== excludePartnerId).reduce((sum, a) => sum + a.allocatedSeats, 0);

export class B2BAllotmentService {
  constructor(private repository: B2BInventoryRepository) {}

  async list(dto: ListAllotmentsQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.B2BInventoryAllotmentWhereInput = {
      ...(dto.partnerId ? { partnerId: dto.partnerId } : {}),
      ...(dto.departureId ? { departureId: dto.departureId } : {}),
      ...(dto.packageId ? { departure: { packageId: dto.packageId } } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };
    const { items, total } = await this.repository.listAllotments(where, pagination.skip, pagination.take);
    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async upsert(adminId: string, dto: UpsertAllotmentDtoType) {
    return this.repository.withTransaction(async (tx: InventoryTx) => {
      const dep = await tx.lockDeparture(dto.departureId);
      if (!dep) throw new ApiError(404, 'Departure not found');
      const allotments = await tx.lockAllotments(dep.id);

      const partner = await tx.findPartnerStatus(dto.partnerId);
      if (!partner) throw new ApiError(404, 'Partner not found');
      if (partner.status !== 'ACTIVE') throw new ApiError(409, 'Allotments can only be assigned to ACTIVE partners');

      const existing = allotments.find((a) => a.partnerId === dto.partnerId) ?? null;
      const used = existing ? existing.bookedSeats + existing.heldSeats : 0;
      if (dto.allocatedSeats < used) {
        throw new ApiError(409, `Cannot allocate fewer than the ${used} seat(s) already booked or held`);
      }
      if (dep.totalSeats !== null) {
        const wanted = reservedSeats(allotments, dto.partnerId) + (dto.isActive ? dto.allocatedSeats : 0);
        if (wanted > dep.totalSeats) {
          throw new ApiError(409, `Allotments would reserve ${wanted} of ${dep.totalSeats} seats; at most ${dep.totalSeats - reservedSeats(allotments, dto.partnerId)} can go to this partner`);
        }
      }

      const saved = await tx.upsertAllotment(dto.partnerId, dep.id, {
        allocatedSeats: dto.allocatedSeats, releaseBeforeHours: dto.releaseBeforeHours, isActive: dto.isActive,
      });
      await tx.audit(buildAuditEntry({
        actorType: 'admin', actorId: adminId, action: 'allotment.upserted', title: existing ? 'Allotment updated' : 'Allotment created',
        category: 'b2b_allotment', categoryId: saved.id,
        data: {
          partnerId: dto.partnerId, departureId: dep.id,
          from: existing ? { allocatedSeats: existing.allocatedSeats, releaseBeforeHours: existing.releaseBeforeHours, isActive: existing.isActive } : null,
          to: { allocatedSeats: dto.allocatedSeats, releaseBeforeHours: dto.releaseBeforeHours, isActive: dto.isActive },
        },
      }));
      return saved;
    });
  }

  async setCapacity(departureId: string, adminId: string, dto: SetCapacityDtoType) {
    return this.repository.withTransaction(async (tx: InventoryTx) => {
      const dep = await tx.lockDeparture(departureId);
      if (!dep) throw new ApiError(404, 'Departure not found');
      const allotments = await tx.lockAllotments(dep.id);

      if (dto.totalSeats !== null) {
        const used = dep.bookedSeats + dep.heldSeats;
        if (dto.totalSeats < used) throw new ApiError(409, `totalSeats cannot be below the ${used} seat(s) already booked or held`);
        const reserved = reservedSeats(allotments);
        if (dto.totalSeats < reserved) throw new ApiError(409, `totalSeats cannot be below the ${reserved} seat(s) reserved by partner allotments`);
      }

      const updated = await tx.setDepartureCapacity(dep.id, { totalSeats: dto.totalSeats, cutoffHours: dto.cutoffHours ?? dep.cutoffHours });
      await tx.audit(buildAuditEntry({
        actorType: 'admin', actorId: adminId, action: 'departure.capacity_updated', title: 'Departure capacity updated',
        category: 'b2b_departure', categoryId: dep.id,
        data: { from: { totalSeats: dep.totalSeats, cutoffHours: dep.cutoffHours }, to: { totalSeats: updated.totalSeats, cutoffHours: updated.cutoffHours } },
      }));
      return updated;
    });
  }
}
