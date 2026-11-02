import { z } from 'zod';

const TravellerItemDto = z.object({
  fullName: z.string().min(1).max(255),
  gender: z.string().optional(),
  email: z.string().email().max(255),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().min(1).max(100),
  countryCode: z.string().min(1).max(5),
  mobileNumber: z.string().max(50).optional(),
  passportNo: z.string().max(50).optional(),
  passportImage: z.string().optional(),
  photo: z.string().optional(),
  isLead: z.boolean().optional(),
});

export const AddTravellersDto = z.object({
  travellers: z.array(TravellerItemDto).min(1).max(50),
});

export type AddTravellersDtoType = z.infer<typeof AddTravellersDto>;
