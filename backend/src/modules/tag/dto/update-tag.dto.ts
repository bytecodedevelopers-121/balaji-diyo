import { z } from 'zod';
import { CreateTagDto } from './create-tag.dto';

export const UpdateTagDto = CreateTagDto.partial();

export type UpdateTagDtoType = z.infer<typeof UpdateTagDto>;
