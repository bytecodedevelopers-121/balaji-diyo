import { z } from 'zod';
import { CreateTripInfoDto } from './create-trip-info.dto';

export const UpdateTripInfoDto = CreateTripInfoDto.partial();

export type UpdateTripInfoDtoType = z.infer<typeof UpdateTripInfoDto>;
