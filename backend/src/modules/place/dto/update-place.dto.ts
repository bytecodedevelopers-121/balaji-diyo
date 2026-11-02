import { z } from 'zod';
import { CreatePlaceDto } from './create-place.dto';

export const UpdatePlaceDto = CreatePlaceDto.partial();

export type UpdatePlaceDtoType = z.infer<typeof UpdatePlaceDto>;
