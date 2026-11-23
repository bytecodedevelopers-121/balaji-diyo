import { Prisma } from '@prisma/client';

// Storage keys (fileUrl) are never sent to clients — documents are fetched
// through the authorized /kyc-documents/:id/file endpoints instead.
export const kycDocumentSelect = {
  id: true,
  partnerId: true,
  docType: true,
  fileName: true,
  isVerified: true,
  verifiedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.B2BKycDocumentSelect;

// Never select password hashes for partner team members.
export const teamUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  b2bRole: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

export const partnerDetailInclude = {
  tier: true,
  kycDocuments: { select: kycDocumentSelect, orderBy: { createdAt: 'desc' } },
} as const satisfies Prisma.B2BPartnerInclude;

export type PartnerDetail = Prisma.B2BPartnerGetPayload<{ include: typeof partnerDetailInclude }>;

export const toPartnerView = (p: PartnerDetail) => {
  const { walletBalance, creditLimit, creditUsed, creditAlertSentAt, kycDocuments, deletedAt: _deletedAt, ...profile } = p;
  return {
    ...profile,
    kycDocuments,
    wallet: {
      currency: p.currency,
      walletBalance,
      creditLimit,
      creditUsed,
      creditAvailable: creditLimit.minus(creditUsed),
      creditAlertSentAt,
    },
  };
};
