import { z } from 'zod';
import { CreateGlobalCategoryDto } from './create-global-category.dto';

export const UpdateGlobalCategoryDto = CreateGlobalCategoryDto.partial();

export type UpdateGlobalCategoryDtoType = z.infer<typeof UpdateGlobalCategoryDto>;
