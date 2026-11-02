import { z } from 'zod';

export const CreateBookingDto = z.object({
  packageId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  numberOfTraveller: z.number().int().min(1),
  fullName: z.string().min(1).max(255),
  email: z.string().email().max(255),
  dateOfBirth: z.coerce.date(),
  nationality: z.string().min(1).max(100),
  countryCode: z.string().min(1).max(5),
  mobileNumber: z.string().max(50).optional(),
  pickupDetails: z.string().max(5000).optional(),
  paymentOptions: z.string().min(1).max(15),
  totalPrice: z.number().min(0),
  payablePercentage: z.number().int().min(0).max(100).optional(),
});

export type CreateBookingDtoType = z.infer<typeof CreateBookingDto>;
