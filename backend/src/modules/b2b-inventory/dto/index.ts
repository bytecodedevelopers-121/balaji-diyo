import { z } from 'zod';

export const CreateHoldDto = z.object({
  departureId: z.string().min(1).max(64),
  seatsHeld: z.number().int().min(1).max(500),
});
export type CreateHoldDtoType = z.infer<typeof CreateHoldDto>;

export const ListHoldsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['ACTIVE', 'CONVERTED', 'EXPIRED', 'RELEASED']).optional(),
});
export type ListHoldsQueryDtoType = z.infer<typeof ListHoldsQueryDto>;

export const HoldParamsDto = z.object({ id: z.string().min(1).max(64) });
