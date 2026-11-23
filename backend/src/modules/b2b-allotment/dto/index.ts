import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

const id = z.string().min(1).max(64);

export const UpsertAllotmentDto = z.object({
  partnerId: id,
  departureId: id,
  allocatedSeats: z.number().int().min(0).max(10_000),
  releaseBeforeHours: z.number().int().min(0).max(2160).default(72),
  isActive: z.boolean().default(true),
});
export type UpsertAllotmentDtoType = z.infer<typeof UpsertAllotmentDto>;

export const ListAllotmentsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(15),
  partnerId: id.optional(),
  departureId: id.optional(),
  packageId: id.optional(),
  isActive: booleanQueryParam,
});
export type ListAllotmentsQueryDtoType = z.infer<typeof ListAllotmentsQueryDto>;

// totalSeats null = stop tracking capacity on this departure.
export const SetCapacityDto = z.object({
  totalSeats: z.number().int().min(0).max(100_000).nullable(),
  cutoffHours: z.number().int().min(0).max(2160).optional(),
});
export type SetCapacityDtoType = z.infer<typeof SetCapacityDto>;

export const DepartureParamsDto = z.object({ id });
