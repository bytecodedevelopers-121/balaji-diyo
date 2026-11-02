import { z } from 'zod';
import { CreateStoryAuthorDto } from './create-story-author.dto';

export const UpdateStoryAuthorDto = CreateStoryAuthorDto.partial();

export type UpdateStoryAuthorDtoType = z.infer<typeof UpdateStoryAuthorDto>;
