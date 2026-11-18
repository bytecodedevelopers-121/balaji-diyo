import { z } from 'zod';

export const UpdateDepartureDto = z.object({
  departureDate: z.coerce.date().optional(),
  departureCost: z.number().min(0).optional(),
  departureNote: z.string().max(255).optional(),
  departureStatus: z.string().min(1).max(20).optional(),
  isLastMinute: z.boolean().optional(),
});

export type UpdateDepartureDtoType = z.infer<typeof UpdateDepartureDto>;
