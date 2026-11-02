import { z } from 'zod';
import { CreateCategoryTypeDto } from './create-category-type.dto';

export const UpdateCategoryTypeDto = CreateCategoryTypeDto.partial();

export type UpdateCategoryTypeDtoType = z.infer<typeof UpdateCategoryTypeDto>;
