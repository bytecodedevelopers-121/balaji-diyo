import { z } from 'zod';
import { CreateStoryDto } from './create-story.dto';

export const UpdateStoryDto = CreateStoryDto.partial();

export type UpdateStoryDtoType = z.infer<typeof UpdateStoryDto>;
