import { z } from 'zod';

export const CreateDepartureDto = z.object({
  packageId: z.string().min(1),
  departureDate: z.coerce.date(),
  departureCost: z.number().min(0),
  departureNote: z.string().max(255).optional(),
  departureStatus: z.string().min(1).max(20),
});

export type CreateDepartureDtoType = z.infer<typeof CreateDepartureDto>;

export const CreateDeparturesBulkDto = z.object({
  packageId: z.string().min(1),
  departures: z
    .array(
      z.object({
        departureDate: z.coerce.date(),
        departureCost: z.number().min(0),
        departureNote: z.string().max(255).optional(),
        departureStatus: z.string().min(1).max(20),
      }),
    )
    .max(100),
});

export type CreateDeparturesBulkDtoType = z.infer<typeof CreateDeparturesBulkDto>;
