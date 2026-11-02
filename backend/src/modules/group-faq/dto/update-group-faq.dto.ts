import { z } from 'zod';
import { CreateGroupFaqDto } from './create-group-faq.dto';

export const UpdateGroupFaqDto = CreateGroupFaqDto.partial();

export type UpdateGroupFaqDtoType = z.infer<typeof UpdateGroupFaqDto>;
