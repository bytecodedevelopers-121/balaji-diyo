import { z } from 'zod';
import { CreateMenuItemDto } from './create-menu-item.dto';

export const UpdateMenuItemDto = CreateMenuItemDto.partial();

export type UpdateMenuItemDtoType = z.infer<typeof UpdateMenuItemDto>;
