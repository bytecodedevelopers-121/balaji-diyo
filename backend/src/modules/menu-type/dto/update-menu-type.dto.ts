import { z } from 'zod';
import { CreateMenuTypeDto } from './create-menu-type.dto';

export const UpdateMenuTypeDto = CreateMenuTypeDto.partial();

export type UpdateMenuTypeDtoType = z.infer<typeof UpdateMenuTypeDto>;
