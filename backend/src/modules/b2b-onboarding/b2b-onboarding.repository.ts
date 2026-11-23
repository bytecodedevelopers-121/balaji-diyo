import { Prisma, PrismaClient, B2BPartnerStatus } from '@prisma/client';
import { PARTNER_ROLE_NAME } from '../b2b-common/b2b.constants';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { kycDocumentSelect, partnerDetailInclude } from '../b2b-common/b2b-partner.mapper';

export interface RegisterPartnerInput {
  partnerId: string;
  partnerCode: string;
  tierId: string;
  roleId: string;
  partner: {
    legalName: string; tradeName?: string; email: string; phone?: string; country: string;
    city?: string; address?: string; website?: string; taxOrRegNumber?: string;
  };
  admin: { email: string; passwordHash: string; firstName: string; lastName: string };
  documents: { docType: string; fileUrl: string; fileName: string }[];
}

const RESUBMITTABLE: B2BPartnerStatus[] = ['PENDING_KYC', 'REJECTED'];

export class B2BOnboardingRepository {
  constructor(private prisma: PrismaClient) {}

  /** Entry tier = active tier with the lowest priorityOrder. */
  findEntryTier() {
    return this.prisma.b2BPartnerTier.findFirst({ where: { isActive: true }, orderBy: [{ priorityOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  ensurePartnerRole() {
    return this.prisma.role.upsert({
      where: { name: PARTNER_ROLE_NAME },
      update: {},
      create: { name: PARTNER_ROLE_NAME, description: 'B2B agency user (no internal permissions)', isSystem: true },
    });
  }

  // Includes soft-deleted users: the unique constraint on email still applies to them.
  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
  }

  findPartnerByTaxNumber(taxOrRegNumber: string) {
    return this.prisma.b2BPartner.findFirst({
      where: { taxOrRegNumber: { equals: taxOrRegNumber, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
    });
  }

  registerPartner(input: RegisterPartnerInput) {
    return this.prisma.$transaction(async (tx) => {
      const partner = await tx.b2BPartner.create({
        data: {
          id: input.partnerId,
          partnerCode: input.partnerCode,
          tierId: input.tierId,
          ...input.partner,
          status: 'PENDING_KYC',
          kycDocuments: { create: input.documents },
        },
        select: { id: true, partnerCode: true, legalName: true, status: true, tier: { select: { code: true, name: true } } },
      });
      const user = await tx.user.create({
        data: {
          email: input.admin.email,
          password: input.admin.passwordHash,
          firstName: input.admin.firstName,
          lastName: input.admin.lastName,
          roleId: input.roleId,
          isSuperAdmin: false,
          isActive: true,
          b2bPartnerId: partner.id,
          b2bRole: 'AGENCY_ADMIN',
        },
        select: { id: true, email: true, b2bRole: true },
      });
      await tx.activityLog.create({
        data: buildAuditEntry({
          actorType: 'user', actorId: user.id, action: 'partner.registered', title: 'Partner registered',
          category: 'b2b_partner', categoryId: partner.id,
          data: { partnerCode: partner.partnerCode, legalName: input.partner.legalName, documents: input.documents.length },
        }),
      });
      return { partner, user };
    });
  }

  findPartnerDetail(partnerId: string) {
    return this.prisma.b2BPartner.findFirst({ where: { id: partnerId, deletedAt: null }, include: partnerDetailInclude });
  }

  /**
   * Adds documents when the partner is PENDING_KYC/REJECTED. A REJECTED partner
   * is moved back to PENDING_KYC (resubmission). Returns null when the status
   * does not allow submission — re-checked inside the transaction so a
   * concurrent admin decision can't be raced.
   */
  addKycDocuments(partnerId: string, userId: string, documents: { docType: string; fileUrl: string; fileName: string }[]) {
    return this.prisma.$transaction(async (tx) => {
      const partner = await tx.b2BPartner.findFirst({ where: { id: partnerId, deletedAt: null }, select: { status: true } });
      if (!partner || !RESUBMITTABLE.includes(partner.status)) return null;

      const created = await Promise.all(
        documents.map((d) => tx.b2BKycDocument.create({ data: { partnerId, ...d }, select: kycDocumentSelect })),
      );
      const resubmitted = partner.status === 'REJECTED';
      if (resubmitted) {
        await tx.b2BPartner.update({ where: { id: partnerId }, data: { status: 'PENDING_KYC', rejectionReason: null } });
      }
      await tx.activityLog.create({
        data: buildAuditEntry({
          actorType: 'user', actorId: userId,
          action: resubmitted ? 'partner.kyc_resubmitted' : 'partner.kyc_uploaded',
          title: resubmitted ? 'KYC resubmitted after rejection' : 'KYC documents uploaded',
          category: 'b2b_partner', categoryId: partnerId,
          data: { documentIds: created.map((c) => c.id), docTypes: created.map((c) => c.docType) } satisfies Prisma.InputJsonValue,
        }),
      });
      return created;
    });
  }

  findKycDocument(partnerId: string, docId: string) {
    return this.prisma.b2BKycDocument.findFirst({ where: { id: docId, partnerId, partner: { deletedAt: null } } });
  }
}
