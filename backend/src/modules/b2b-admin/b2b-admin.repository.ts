import { Prisma, PrismaClient, B2BPartnerStatus } from '@prisma/client';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { kycDocumentSelect, partnerDetailInclude, teamUserSelect } from '../b2b-common/b2b-partner.mapper';

export interface DecisionPlan {
  expectedStatus: B2BPartnerStatus;
  data: Prisma.B2BPartnerUncheckedUpdateManyInput;
  audit: Prisma.ActivityLogUncheckedCreateInput[];
}

const listInclude = {
  tier: { select: { id: true, code: true, name: true } },
  kycDocuments: { select: { isVerified: true } },
  _count: { select: { users: true } },
} as const satisfies Prisma.B2BPartnerInclude;

export class B2BAdminRepository {
  constructor(private prisma: PrismaClient) {}

  // ── Partners ──────────────────────────────────────────────────────────────

  async listPartners(where: Prisma.B2BPartnerWhereInput, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.b2BPartner.findMany({ where, include: listInclude, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.b2BPartner.count({ where }),
    ]);
    return { items, total };
  }

  findPartnerDetail(id: string) {
    return this.prisma.b2BPartner.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...partnerDetailInclude,
        users: { where: { deletedAt: null }, select: teamUserSelect, orderBy: { createdAt: 'asc' } },
      },
    });
  }

  findPartnerCore(id: string) {
    return this.prisma.b2BPartner.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, tierId: true, currency: true, walletBalance: true, creditLimit: true, creditUsed: true, kycVerifiedAt: true },
    });
  }

  countVerifiedDocuments(partnerId: string) {
    return this.prisma.b2BKycDocument.count({ where: { partnerId, isVerified: true } });
  }

  // ── KYC documents ─────────────────────────────────────────────────────────

  /** Scoped by both ids so a document can never be reviewed under the wrong partner. */
  findDocument(partnerId: string, docId: string) {
    return this.prisma.b2BKycDocument.findFirst({ where: { id: docId, partnerId, partner: { deletedAt: null } } });
  }

  reviewDocument(
    partnerId: string,
    docId: string,
    data: { isVerified: boolean; verifiedAt: Date | null; notes: string | null },
    audit: Prisma.ActivityLogUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.b2BKycDocument.update({ where: { id: docId }, data, select: kycDocumentSelect });
      await tx.activityLog.create({ data: audit });
      return doc;
    });
  }

  // ── Decisions ─────────────────────────────────────────────────────────────

  /**
   * Compare-and-set on status: the update only applies if the partner is still
   * in the status the service validated the transition against. Returns false
   * (nothing written, no audit rows) if an admin changed it concurrently.
   */
  applyDecision(partnerId: string, plan: DecisionPlan): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.b2BPartner.updateMany({
        where: { id: partnerId, status: plan.expectedStatus, deletedAt: null },
        data: plan.data,
      });
      if (count === 0) return false;
      if (plan.audit.length > 0) await tx.activityLog.createMany({ data: plan.audit });
      return true;
    });
  }

  // ── Tiers ─────────────────────────────────────────────────────────────────

  listTiers(activeOnly: boolean) {
    return this.prisma.b2BPartnerTier.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ priorityOrder: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { partners: true } } },
    });
  }

  findTier(id: string) {
    return this.prisma.b2BPartnerTier.findUnique({ where: { id } });
  }

  createTier(data: Prisma.B2BPartnerTierCreateInput, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const tier = await tx.b2BPartnerTier.create({ data });
      await tx.activityLog.create({
        data: buildAuditEntry({ actorType: 'admin', actorId, action: 'tier.created', title: 'Partner tier created', category: 'b2b_tier', categoryId: tier.id, data: { code: tier.code } }),
      });
      return tier;
    });
  }

  updateTier(id: string, data: Prisma.B2BPartnerTierUpdateInput, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const tier = await tx.b2BPartnerTier.update({ where: { id }, data });
      await tx.activityLog.create({
        data: buildAuditEntry({
          actorType: 'admin', actorId, action: 'tier.updated', title: 'Partner tier updated', category: 'b2b_tier', categoryId: id,
          data: { changed: Object.keys(data) },
        }),
      });
      return tier;
    });
  }
}
