import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

const money = z.number().min(0).max(9_999_999_999);

export const ListPartnersQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PENDING_KYC', 'ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
  tierId: z.string().min(1).max(64).optional(),
  q: z.string().trim().max(100).optional(),
});
export type ListPartnersQueryDtoType = z.infer<typeof ListPartnersQueryDto>;

export const PartnerParamsDto = z.object({ id: z.string().min(1).max(64) });
export const PartnerDocParamsDto = z.object({ id: z.string().min(1).max(64), docId: z.string().min(1).max(64) });
export const TierParamsDto = z.object({ id: z.string().min(1).max(64) });

export const ReviewKycDto = z
  .object({
    documentId: z.string().min(1).max(64),
    action: z.enum(['VERIFY', 'REJECT']),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.action !== 'REJECT' || (v.notes && v.notes.length >= 3), {
    message: 'notes are required when rejecting a document',
    path: ['notes'],
  });
export type ReviewKycDtoType = z.infer<typeof ReviewKycDto>;

export const PartnerDecisionDto = z
  .object({
    status: z.enum(['ACTIVE', 'REJECTED', 'SUSPENDED']).optional(),
    rejectionReason: z.string().trim().max(2000).optional(), // reason shown to the partner for REJECTED / SUSPENDED
    tierId: z.string().min(1).max(64).optional(),
    creditLimit: money.optional(),
    currency: z.string().trim().length(3).transform((c) => c.toUpperCase()).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Provide at least one field to change' })
  .refine((v) => v.status !== 'REJECTED' || (v.rejectionReason && v.rejectionReason.length >= 3), {
    message: 'rejectionReason is required when rejecting a partner',
    path: ['rejectionReason'],
  });
export type PartnerDecisionDtoType = z.infer<typeof PartnerDecisionDto>;

const tierFields = {
  name: z.string().trim().min(2).max(60),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,24}$/, 'code must be 2-24 chars of A-Z, 0-9, _'),
  priorityOrder: z.number().int().min(0).max(1000),
  defaultRateType: z.enum(['NET', 'COMMISSIONABLE']),
  defaultCommissionPct: z.number().min(0).max(100),
  defaultCreditLimit: money,
  creditTermDays: z.number().int().min(0).max(365),
  holdDurationMinutes: z.number().int().min(1).max(10_080),
  slaResponseHours: z.number().int().min(1).max(720),
  isActive: z.boolean(),
};

export const CreateTierDto = z.object({
  name: tierFields.name,
  code: tierFields.code,
  priorityOrder: tierFields.priorityOrder.optional(),
  defaultRateType: tierFields.defaultRateType.optional(),
  defaultCommissionPct: tierFields.defaultCommissionPct.optional(),
  defaultCreditLimit: tierFields.defaultCreditLimit.optional(),
  creditTermDays: tierFields.creditTermDays.optional(),
  holdDurationMinutes: tierFields.holdDurationMinutes.optional(),
  slaResponseHours: tierFields.slaResponseHours.optional(),
  isActive: tierFields.isActive.optional(),
});
export type CreateTierDtoType = z.infer<typeof CreateTierDto>;

// `code` is immutable: partners/bookings reference tiers by id, but codes are used in reports and integrations.
export const UpdateTierDto = z
  .object({ ...tierFields, code: z.never().optional() })
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Provide at least one field to change' });
export type UpdateTierDtoType = z.infer<typeof UpdateTierDto>;

export const ListTiersQueryDto = z.object({ activeOnly: booleanQueryParam });
