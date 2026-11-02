import { z } from 'zod';
import { CreateItineraryDto } from './create-itinerary.dto';

export const UpdateItineraryDto = CreateItineraryDto.omit({ packageId: true }).partial();

export type UpdateItineraryDtoType = z.infer<typeof UpdateItineraryDto>;
