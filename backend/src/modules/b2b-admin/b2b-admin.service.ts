import { Prisma, B2BPartnerStatus } from '@prisma/client';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { B2BAdminRepository, DecisionPlan } from './b2b-admin.repository';
import { KycStorage } from '../b2b-common/b2b-kyc-storage';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { toPartnerView } from '../b2b-common/b2b-partner.mapper';
import type { ListPartnersQueryDtoType, ReviewKycDtoType, PartnerDecisionDtoType, CreateTierDtoType, UpdateTierDtoType } from './dto';

// from → allowed targets. Re-activating a SUSPENDED partner skips the KYC-document gate (already approved once).
const TRANSITIONS: Record<B2BPartnerStatus, B2BPartnerStatus[]> = {
  PENDING_KYC: ['ACTIVE', 'REJECTED'],
  REJECTED: ['ACTIVE'], // back to PENDING_KYC happens only through the partner's own resubmission
  ACTIVE: ['SUSPENDED'],
  SUSPENDED: ['ACTIVE'],
};

export class B2BAdminService {
  constructor(
    private repository: B2BAdminRepository,
    private storage: KycStorage,
  ) {}

  // ── Partners ──────────────────────────────────────────────────────────────

  async listPartners(dto: ListPartnersQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const q = dto.q;
    const where: Prisma.B2BPartnerWhereInput = {
      deletedAt: null,
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.tierId ? { tierId: dto.tierId } : {}),
      ...(q
        ? {
            OR: [
              { legalName: { contains: q, mode: 'insensitive' } },
              { tradeName: { contains: q, mode: 'insensitive' } },
              { partnerCode: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { taxOrRegNumber: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { items, total } = await this.repository.listPartners(where, pagination.skip, pagination.take);
    const rows = items.map(({ kycDocuments, walletBalance: _w, creditUsed: _u, creditAlertSentAt: _a, deletedAt: _d, ...p }) => ({
      ...p,
      kyc: { total: kycDocuments.length, verified: kycDocuments.filter((d) => d.isVerified).length },
    }));
    return PaginationDto.create({ items: rows, page: pagination.page, perPage: pagination.perPage, total });
  }

  async getPartner(id: string) {
    const partner = await this.repository.findPartnerDetail(id);
    if (!partner) throw new ApiError(404, 'Partner not found');
    const { users, ...rest } = partner;
    return { ...toPartnerView(rest), users };
  }

  // ── KYC ───────────────────────────────────────────────────────────────────

  async reviewDocument(partnerId: string, adminId: string, dto: ReviewKycDtoType) {
    const doc = await this.repository.findDocument(partnerId, dto.documentId);
    if (!doc) throw new ApiError(404, 'Document not found');

    const verify = dto.action === 'VERIFY';
    return this.repository.reviewDocument(
      partnerId,
      doc.id,
      { isVerified: verify, verifiedAt: verify ? new Date() : null, notes: dto.notes ?? null },
      buildAuditEntry({
        actorType: 'admin', actorId: adminId,
        action: verify ? 'partner.kyc_document_verified' : 'partner.kyc_document_rejected',
        title: verify ? 'KYC document verified' : 'KYC document rejected',
        category: 'b2b_partner', categoryId: partnerId,
        data: { documentId: doc.id, docType: doc.docType, notes: dto.notes ?? null },
      }),
    );
  }

  async getKycFile(partnerId: string, docId: string) {
    const doc = await this.repository.findDocument(partnerId, docId);
    if (!doc) throw new ApiError(404, 'Document not found');
    return { absolutePath: this.storage.resolve(doc.fileUrl), fileName: doc.fileName ?? 'document' };
  }

  // ── Decision ──────────────────────────────────────────────────────────────

  async decide(partnerId: string, adminId: string, dto: PartnerDecisionDtoType) {
    const partner = await this.repository.findPartnerCore(partnerId);
    if (!partner) throw new ApiError(404, 'Partner not found');

    const data: Prisma.B2BPartnerUncheckedUpdateManyInput = {};
    const audit: Prisma.ActivityLogUncheckedCreateInput[] = [];
    const log = (action: Parameters<typeof buildAuditEntry>[0]['action'], title: string, d: Prisma.InputJsonValue) =>
      audit.push(buildAuditEntry({ actorType: 'admin', actorId: adminId, action, title, category: 'b2b_partner', categoryId: partnerId, data: d }));

    // Tier
    let effectiveTier: { defaultCreditLimit: Prisma.Decimal } | null = null;
    if (dto.tierId) {
      const tier = await this.repository.findTier(dto.tierId);
      if (!tier) throw new ApiError(404, 'Tier not found');
      if (!tier.isActive && tier.id !== partner.tierId) throw new ApiError(409, 'Tier is inactive');
      effectiveTier = tier;
      if (tier.id !== partner.tierId) {
        data.tierId = tier.id;
        log('partner.tier_assigned', 'Partner tier assigned', { from: partner.tierId, to: tier.id, code: tier.code });
      }
    }

    // Status
    const firstActivation = dto.status === 'ACTIVE' && !partner.kycVerifiedAt;
    if (dto.status) {
      if (dto.status === partner.status) throw new ApiError(409, `Partner is already ${partner.status}`);
      if (!TRANSITIONS[partner.status].includes(dto.status)) {
        throw new ApiError(409, `Cannot change partner from ${partner.status} to ${dto.status}`);
      }
      data.status = dto.status;
      if (dto.status === 'ACTIVE') {
        if (firstActivation && (await this.repository.countVerifiedDocuments(partnerId)) === 0) {
          throw new ApiError(409, 'Verify at least one KYC document before approving this partner');
        }
        data.rejectionReason = null;
        if (firstActivation) {
          data.kycVerifiedAt = new Date();
          data.kycVerifiedById = adminId;
        }
      } else {
        data.rejectionReason = dto.rejectionReason || null;
      }
      log('partner.status_changed', `Partner status ${partner.status} → ${dto.status}`, {
        from: partner.status, to: dto.status, reason: dto.rejectionReason ?? null,
      });
    } else if (dto.rejectionReason !== undefined) {
      throw new ApiError(400, 'rejectionReason only applies together with a REJECTED or SUSPENDED status');
    }

    // Credit limit — explicit value wins; on first activation an untouched (0) limit inherits the tier default.
    let creditLimit: Prisma.Decimal | undefined;
    if (dto.creditLimit !== undefined) {
      creditLimit = new Prisma.Decimal(dto.creditLimit);
    } else if (firstActivation && partner.creditLimit.isZero()) {
      const tier = effectiveTier ?? (await this.repository.findTier(partner.tierId));
      if (tier && !tier.defaultCreditLimit.isZero()) creditLimit = tier.defaultCreditLimit;
    }
    if (creditLimit) {
      if (creditLimit.lessThan(partner.creditUsed)) {
        throw new ApiError(409, 'Credit limit cannot be lower than the credit already in use');
      }
      if (!creditLimit.equals(partner.creditLimit)) {
        data.creditLimit = creditLimit;
        // Re-arm the 80% alert when a bigger limit drops utilization back under the threshold.
        if (creditLimit.gt(partner.creditLimit) && !creditLimit.isZero() && partner.creditUsed.dividedBy(creditLimit).lt(0.8)) data.creditAlertSentAt = null;
        log('partner.credit_updated', 'Partner credit limit updated', { from: partner.creditLimit.toString(), to: creditLimit.toString() });
      }
    }

    // Currency — no FX handling yet, so it is frozen once money has moved.
    if (dto.currency && dto.currency !== partner.currency) {
      if (!partner.walletBalance.isZero() || !partner.creditUsed.isZero()) {
        throw new ApiError(409, 'Currency cannot be changed while the wallet balance or credit in use is non-zero');
      }
      data.currency = dto.currency;
      log('partner.credit_updated', 'Partner currency updated', { currencyFrom: partner.currency, currencyTo: dto.currency });
    }

    if (Object.keys(data).length === 0) throw new ApiError(409, 'No changes to apply');

    const plan: DecisionPlan = { expectedStatus: partner.status, data, audit };
    if (!(await this.repository.applyDecision(partnerId, plan))) {
      throw new ApiError(409, 'Partner was modified by someone else. Reload and try again.');
    }
    return this.getPartner(partnerId);
  }

  // ── Tiers ─────────────────────────────────────────────────────────────────

  listTiers(activeOnly: boolean) {
    return this.repository.listTiers(activeOnly);
  }

  createTier(adminId: string, dto: CreateTierDtoType) {
    return this.repository.createTier(dto, adminId);
  }

  async updateTier(id: string, adminId: string, dto: UpdateTierDtoType) {
    const existing = await this.repository.findTier(id);
    if (!existing) throw new ApiError(404, 'Tier not found');
    return this.repository.updateTier(id, dto, adminId);
  }
}
