import { CreatePageDto } from './create-page.dto';
import { z } from 'zod';

export const UpdatePageDto = CreatePageDto.partial();

export type UpdatePageDtoType = z.infer<typeof UpdatePageDto>;
