import { z } from 'zod';
import { CreateRedirectDto } from './create-redirect.dto';

export const UpdateRedirectDto = CreateRedirectDto.partial();

export type UpdateRedirectDtoType = z.infer<typeof UpdateRedirectDto>;
