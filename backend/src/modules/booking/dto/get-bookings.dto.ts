import { z } from 'zod';

export const GetBookingsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  packageId: z.string().optional(),
});

export type GetBookingsDtoType = z.infer<typeof GetBookingsDto>;
