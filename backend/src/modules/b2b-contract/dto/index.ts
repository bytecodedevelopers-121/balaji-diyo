import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';
import { blackoutSchema, dayString, moneyInput, percentInput } from '../../b2b-common/b2b-inputs';

const id = z.string().min(1).max(64);
const pax = z.number().int().min(1).max(500);
const cutoff = z.number().int().min(0).max(2160);

export const CreateContractDto = z.object({
  partnerId: id,
  packageId: id,
  rateType: z.enum(['NET', 'COMMISSIONABLE']).default('NET'),
  netUnitPrice: moneyInput.nullish(),
  commissionPct: percentInput.nullish(),
  validFrom: dayString,
  validTo: dayString,
  blackoutDates: blackoutSchema.nullish(),
  minPax: pax.nullish(),
  maxPax: pax.nullish(),
  cutoffHours: cutoff.default(48),
  isActive: z.boolean().default(true),
});
export type CreateContractDtoType = z.infer<typeof CreateContractDto>;

// partner/package are immutable; nullable fields can be cleared.
export const UpdateContractDto = z
  .object({
    rateType: z.enum(['NET', 'COMMISSIONABLE']),
    netUnitPrice: moneyInput.nullable(),
    commissionPct: percentInput.nullable(),
    validFrom: dayString,
    validTo: dayString,
    blackoutDates: blackoutSchema,
    minPax: pax.nullable(),
    maxPax: pax.nullable(),
    cutoffHours: cutoff,
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Provide at least one field to change' });
export type UpdateContractDtoType = z.infer<typeof UpdateContractDto>;

export const ListContractsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(15),
  partnerId: id.optional(),
  packageId: id.optional(),
  isActive: booleanQueryParam,
});
export type ListContractsQueryDtoType = z.infer<typeof ListContractsQueryDto>;

export const ContractParamsDto = z.object({ id });
