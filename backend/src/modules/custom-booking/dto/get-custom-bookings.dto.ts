import { z } from 'zod';

export const GetCustomBookingsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  packageId: z.string().optional(),
});

export type GetCustomBookingsDtoType = z.infer<typeof GetCustomBookingsDto>;
