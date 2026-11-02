import { z } from 'zod';

export const CreateMenuItemDto = z.object({
  typeId: z.string().min(1, 'typeId is required'),
  label: z.string().min(1).max(255),
  itemOrder: z.number().int().optional(),
  isExternal: z.boolean().optional(),
  externalLink: z.string().max(255).optional(),
  urlSegment: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional(),
});

export type CreateMenuItemDtoType = z.infer<typeof CreateMenuItemDto>;
