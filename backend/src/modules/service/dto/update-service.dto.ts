import { z } from 'zod';
import { CreateServiceDto } from './create-service.dto';

export const UpdateServiceDto = CreateServiceDto.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export type UpdateServiceDtoType = z.infer<typeof UpdateServiceDto>;
