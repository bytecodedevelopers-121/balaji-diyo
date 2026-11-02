import { z } from 'zod';
import { CreateCategoryDto } from './create-category.dto';

export const UpdateCategoryDto = CreateCategoryDto.partial();

export type UpdateCategoryDtoType = z.infer<typeof UpdateCategoryDto>;
