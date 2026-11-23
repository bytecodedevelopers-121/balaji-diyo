import { Prisma } from '@prisma/client';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { Dec, dayToDate, utcDay } from '../b2b-common/b2b-money';
import { B2BContractRepository, ContractTx } from './b2b-contract.repository';
import type { DateRange } from '../b2b-pricing/pricing.types';
import type { CreateContractDtoType, ListContractsQueryDtoType, UpdateContractDtoType } from './dto';

interface ContractFields {
  rateType: 'NET' | 'COMMISSIONABLE';
  netUnitPrice: Dec | null;
  commissionPct: Dec | null;
  validFrom: string;
  validTo: string;
  blackoutDates: DateRange[];
  minPax: number | null;
  maxPax: number | null;
  cutoffHours: number;
  isActive: boolean;
}

/** Cross-field rules; run on the merged result so PATCH can't produce an inconsistent contract. */
const assertConsistent = (c: ContractFields): void => {
  if (c.validFrom > c.validTo) throw new ApiError(400, 'validFrom must be on or before validTo');
  if (c.minPax !== null && c.maxPax !== null && c.minPax > c.maxPax) throw new ApiError(400, 'minPax cannot exceed maxPax');
  if (c.rateType === 'NET') {
    if (c.netUnitPrice === null) throw new ApiError(400, 'netUnitPrice is required for a NET contract');
    if (c.commissionPct !== null) throw new ApiError(400, 'commissionPct only applies to COMMISSIONABLE contracts');
  } else if (c.netUnitPrice !== null) {
    throw new ApiError(400, 'netUnitPrice only applies to NET contracts (clear it when switching to COMMISSIONABLE)');
  }
};

const toDbData = (c: ContractFields) => ({
  rateType: c.rateType,
  netUnitPrice: c.netUnitPrice,
  commissionPct: c.commissionPct,
  validFrom: dayToDate(c.validFrom),
  validTo: dayToDate(c.validTo),
  blackoutDates: c.blackoutDates satisfies Prisma.InputJsonValue,
  minPax: c.minPax,
  maxPax: c.maxPax,
  cutoffHours: c.cutoffHours,
  isActive: c.isActive,
});

const assertNoOverlap = async (tx: ContractTx, partnerId: string, packageId: string, c: ContractFields, excludeId?: string) => {
  if (!c.isActive) return;
  const clash = await tx.findOverlapping(partnerId, packageId, dayToDate(c.validFrom), dayToDate(c.validTo), excludeId);
  if (clash) {
    throw new ApiError(409, `An active contract already covers ${utcDay(clash.validFrom)} to ${utcDay(clash.validTo)} for this partner and package. Deactivate or adjust it first.`);
  }
};

export class B2BContractService {
  constructor(private repository: B2BContractRepository) {}

  async list(dto: ListContractsQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.B2BPartnerContractWhereInput = {
      ...(dto.partnerId ? { partnerId: dto.partnerId } : {}),
      ...(dto.packageId ? { packageId: dto.packageId } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };
    const { items, total } = await this.repository.list(where, pagination.skip, pagination.take);
    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async create(adminId: string, dto: CreateContractDtoType) {
    const [partner, pkg] = await Promise.all([this.repository.findPartner(dto.partnerId), this.repository.findPackage(dto.packageId)]);
    if (!partner) throw new ApiError(404, 'Partner not found');
    if (!pkg) throw new ApiError(404, 'Package not found');

    const fields: ContractFields = {
      rateType: dto.rateType,
      netUnitPrice: dto.netUnitPrice ?? null,
      commissionPct: dto.commissionPct ?? null,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
      blackoutDates: dto.blackoutDates ?? [],
      minPax: dto.minPax ?? null,
      maxPax: dto.maxPax ?? null,
      cutoffHours: dto.cutoffHours,
      isActive: dto.isActive,
    };
    assertConsistent(fields);

    return this.repository.withTransaction(async (tx) => {
      await tx.lockPartner(dto.partnerId);
      await assertNoOverlap(tx, dto.partnerId, dto.packageId, fields);
      const created = await tx.create({ partnerId: dto.partnerId, packageId: dto.packageId, ...toDbData(fields) });
      await tx.audit(buildAuditEntry({
        actorType: 'admin', actorId: adminId, action: 'contract.created', title: 'Partner contract created', category: 'b2b_contract', categoryId: created.id,
        data: { partnerId: dto.partnerId, packageId: dto.packageId, rateType: fields.rateType, validFrom: fields.validFrom, validTo: fields.validTo, isActive: fields.isActive },
      }));
      return created;
    });
  }

  async update(id: string, adminId: string, dto: UpdateContractDtoType) {
    return this.repository.withTransaction(async (tx) => {
      const probe = await tx.findById(id);
      if (!probe) throw new ApiError(404, 'Contract not found');
      await tx.lockPartner(probe.partnerId);
      const existing = await tx.findById(id); // re-read under the lock
      if (!existing) throw new ApiError(404, 'Contract not found');

      const before: ContractFields = {
        rateType: existing.rateType,
        netUnitPrice: existing.netUnitPrice,
        commissionPct: existing.commissionPct,
        validFrom: utcDay(existing.validFrom),
        validTo: utcDay(existing.validTo),
        blackoutDates: (existing.blackoutDates as DateRange[] | null) ?? [],
        minPax: existing.minPax,
        maxPax: existing.maxPax,
        cutoffHours: existing.cutoffHours,
        isActive: existing.isActive,
      };
      const merged: ContractFields = {
        ...before,
        ...Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)),
      };
      assertConsistent(merged);
      await assertNoOverlap(tx, existing.partnerId, existing.packageId, merged, id);

      const updated = await tx.update(id, toDbData(merged));
      const changed = (Object.keys(dto) as (keyof UpdateContractDtoType)[]).filter((k) => dto[k] !== undefined);
      await tx.audit(buildAuditEntry({
        actorType: 'admin', actorId: adminId, action: 'contract.updated', title: 'Partner contract updated', category: 'b2b_contract', categoryId: id,
        data: {
          partnerId: existing.partnerId,
          changed,
          from: Object.fromEntries(changed.map((k) => [k, String(before[k])])),
          to: Object.fromEntries(changed.map((k) => [k, String(merged[k])])),
        },
      }));
      return updated;
    });
  }
}
