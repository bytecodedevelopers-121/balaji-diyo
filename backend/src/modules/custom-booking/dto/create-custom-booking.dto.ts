import { z } from 'zod';

const CustomTravellerItemDto = z.object({
  fullName: z.string().min(1).max(255),
  gender: z.string().min(1),
  email: z.string().email().max(255),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().min(1).max(100),
  countryCode: z.string().min(1).max(5),
  mobileNumber: z.string().max(50).optional(),
  passportNo: z.string().max(50).optional(),
  passportImage: z.string().optional(),
  isLead: z.boolean().optional(),
});

export const CreateCustomBookingDto = z.object({
  packageId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  numberOfTraveller: z.number().int().min(1),
  arrivalDate: z.coerce.date().optional(),
  arrivalFlightNo: z.string().max(50).optional(),
  airportPickup: z.boolean().optional(),
  departureDate: z.coerce.date().optional(),
  departureFlightNo: z.string().max(50).optional(),
  airportDropoff: z.boolean().optional(),
  travelInsurance: z.boolean().optional(),
  findingUs: z.string().max(255).optional(),
  specialRequirement: z.string().optional(),
  travellers: z.array(CustomTravellerItemDto).max(50).optional(),
});

export type CreateCustomBookingDtoType = z.infer<typeof CreateCustomBookingDto>;
