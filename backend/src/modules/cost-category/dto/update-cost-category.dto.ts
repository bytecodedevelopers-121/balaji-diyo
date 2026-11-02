import { z } from 'zod';
import { CreateCostCategoryDto } from './create-cost-category.dto';

export const UpdateCostCategoryDto = CreateCostCategoryDto.partial();

export type UpdateCostCategoryDtoType = z.infer<typeof UpdateCostCategoryDto>;
