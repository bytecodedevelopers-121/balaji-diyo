import { z } from 'zod';
import { CreateFaqDto } from './create-faq.dto';

export const UpdateFaqDto = CreateFaqDto.partial();

export type UpdateFaqDtoType = z.infer<typeof UpdateFaqDto>;
